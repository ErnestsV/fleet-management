<?php

namespace App\Domain\Telemetry\Services;

use App\Domain\Alerts\Services\AlertEvaluationService;
use App\Domain\Alerts\Jobs\EvaluateTelemetryAlertsJob;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Geofences\Services\GeofenceService;
use App\Domain\Realtime\Services\FleetRealtimeNotifier;
use App\Domain\Telemetry\Jobs\ProcessTelemetryEventJob;
use App\Domain\Telemetry\Models\DeviceToken;
use App\Domain\Telemetry\Models\TelemetryEvent;
use App\Domain\Telemetry\Models\VehicleState;
use App\Domain\Trips\Services\TripDerivationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Carbon;

class TelemetryIngestionService
{
    public function __construct(
        private readonly AlertEvaluationService $alertEvaluationService,
        private readonly TelemetryStateResolver $stateResolver,
        private readonly TripDerivationService $tripDerivationService,
        private readonly GeofenceService $geofenceService,
        private readonly FleetRealtimeNotifier $fleetRealtimeNotifier,
    ) {
    }

    public function ingest(Vehicle $vehicle, array $payload, ?string $messageId = null): array
    {
        [$event, $created] = DB::transaction(function () use ($vehicle, $payload, $messageId) {
            $ingestionKey = $this->buildIngestionKey($vehicle, $payload, $messageId);
            $this->acquireIngestionLock($ingestionKey);
            $reservedEventId = $this->reservedTelemetryEventId($ingestionKey);

            if ($reservedEventId !== null) {
                $event = TelemetryEvent::query()
                    ->whereKey($reservedEventId)
                    ->lockForUpdate()
                    ->first();

                if ($event) {
                    return [$event, false];
                }
            }

            $this->reserveIngestionKey($ingestionKey);

            $event = TelemetryEvent::create([
                'company_id' => $vehicle->company_id,
                'vehicle_id' => $vehicle->id,
                'message_id' => $messageId,
                'ingestion_key' => $ingestionKey,
                'occurred_at' => $payload['timestamp'],
                'latitude' => $payload['latitude'],
                'longitude' => $payload['longitude'],
                'speed_kmh' => $payload['speed_kmh'],
                'engine_on' => $payload['engine_on'],
                'odometer_km' => $payload['odometer_km'] ?? null,
                'fuel_level' => $payload['fuel_level'] ?? null,
                'heading' => $payload['heading'] ?? null,
                'payload' => $payload,
            ]);

            $this->markIngestionKeyResolved($ingestionKey, $event->id);

            return [$event, true];
        });

        if ($created || $event->processed_at === null) {
            ProcessTelemetryEventJob::dispatch($event->id)
                ->onQueue((string) config('fleet.telemetry_processing_queue', 'telemetry-processing'))
                ->afterCommit();
        }

        return [$event->fresh() ?? $event, $created];
    }

    public function processStoredEvent(TelemetryEvent $event): ?VehicleState
    {
        return DB::transaction(function () use ($event) {
            $event = TelemetryEvent::query()
                ->lockForUpdate()
                ->find($event->id);

            if (! $event) {
                return null;
            }

            if ($event->processed_at !== null) {
                return VehicleState::query()
                    ->where('vehicle_id', $event->vehicle_id)
                    ->first();
            }

            if ($event->processing_started_at === null) {
                $event->forceFill([
                    'processing_started_at' => now(),
                    'processing_error' => null,
                ])->save();
            }

            $currentState = VehicleState::query()
                ->where('vehicle_id', $event->vehicle_id)
                ->lockForUpdate()
                ->first();

            if (
                $currentState !== null
                && $currentState->last_event_at !== null
                && $event->occurred_at->lt($currentState->last_event_at)
            ) {
                $this->markProcessed($event);

                return $currentState;
            }

            $state = $this->stateResolver->apply($event, $currentState);
            $this->alertEvaluationService->resolveOfflineAlerts($event->company_id, $event->vehicle_id);
            $this->tripDerivationService->handle($event, $state);
            $this->geofenceService->syncEvent($event, $state);
            $this->markProcessed($event);

            EvaluateTelemetryAlertsJob::dispatch($event->id, $state->id)
                ->onQueue((string) config('fleet.telemetry_alerts_queue', 'telemetry-alerts'))
                ->afterCommit();

            DB::afterCommit(fn () => $this->fleetRealtimeNotifier->notifyTelemetryProcessed($event->company_id, $event->vehicle_id));

            return $state;
        });
    }

    public function resolveVehicleFromToken(string $token, ?int $vehicleId): Vehicle
    {
        $device = DeviceToken::query()
            ->where('token', hash('sha256', $token))
            ->where('is_active', true)
            ->when($vehicleId, fn ($query) => $query->where('vehicle_id', $vehicleId))
            ->first();

        if (! $device) {
            throw ValidationException::withMessages([
                'token' => ['Invalid telemetry token.'],
            ]);
        }

        if ($this->shouldRefreshLastUsedAt($device->last_used_at)) {
            $device->forceFill(['last_used_at' => now()])->saveQuietly();
        }

        return Vehicle::query()
            ->whereKey($device->vehicle_id)
            ->where('company_id', $device->company_id)
            ->firstOrFail();
    }

    private function shouldRefreshLastUsedAt(?Carbon $lastUsedAt): bool
    {
        return $lastUsedAt === null || $lastUsedAt->lte(now()->subMinutes(5));
    }

    private function buildIngestionKey(Vehicle $vehicle, array $payload, ?string $messageId): string
    {
        if ($messageId !== null && $messageId !== '') {
            return hash('sha256', implode('|', [
                'vehicle',
                $vehicle->id,
                'message',
                $messageId,
            ]));
        }

        return hash('sha256', json_encode([
            'vehicle_id' => $vehicle->id,
            'timestamp' => (string) $payload['timestamp'],
            'latitude' => round((float) $payload['latitude'], 7),
            'longitude' => round((float) $payload['longitude'], 7),
            'speed_kmh' => round((float) $payload['speed_kmh'], 2),
            'engine_on' => (bool) $payload['engine_on'],
            'odometer_km' => isset($payload['odometer_km']) ? round((float) $payload['odometer_km'], 2) : null,
            'fuel_level' => isset($payload['fuel_level']) ? round((float) $payload['fuel_level'], 2) : null,
            'heading' => isset($payload['heading']) ? round((float) $payload['heading'], 2) : null,
        ], JSON_THROW_ON_ERROR));
    }

    public function markProcessingFailed(int $eventId, string $message): void
    {
        TelemetryEvent::query()
            ->whereKey($eventId)
            ->update([
                'processing_error' => mb_substr($message, 0, 2000),
            ]);
    }

    private function markProcessed(TelemetryEvent $event): void
    {
        $event->forceFill([
            'processed_at' => now(),
            'processing_error' => null,
        ])->save();
    }

    private function acquireIngestionLock(string $ingestionKey): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        $hash = hash('sha256', $ingestionKey);
        $first = hexdec(substr($hash, 0, 8));
        $second = hexdec(substr($hash, 8, 8));

        DB::select('SELECT pg_advisory_xact_lock(?, ?)', [
            $this->normalizeSignedInt32($first),
            $this->normalizeSignedInt32($second),
        ]);
    }

    private function normalizeSignedInt32(int|float $value): int
    {
        return $value > 2147483647
            ? (int) ($value - 4294967296)
            : (int) $value;
    }

    private function reservedTelemetryEventId(string $ingestionKey): ?int
    {
        $reservation = DB::table('telemetry_ingestion_keys')
            ->where('ingestion_key', $ingestionKey)
            ->lockForUpdate()
            ->first();

        return $reservation?->telemetry_event_id !== null
            ? (int) $reservation->telemetry_event_id
            : null;
    }

    private function reserveIngestionKey(string $ingestionKey): void
    {
        $now = now();

        DB::table('telemetry_ingestion_keys')->upsert(
            [[
                'ingestion_key' => $ingestionKey,
                'created_at' => $now,
                'updated_at' => $now,
            ]],
            ['ingestion_key'],
            ['updated_at'],
        );
    }

    private function markIngestionKeyResolved(string $ingestionKey, int $eventId): void
    {
        DB::table('telemetry_ingestion_keys')
            ->where('ingestion_key', $ingestionKey)
            ->update([
                'telemetry_event_id' => $eventId,
                'updated_at' => now(),
            ]);
    }
}
