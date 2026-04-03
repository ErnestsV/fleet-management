<?php

namespace App\Domain\Telemetry\Services;

use App\Domain\Alerts\Jobs\EvaluateTelemetryAlertsJob;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Geofences\Services\GeofenceService;
use App\Domain\Telemetry\Models\DeviceToken;
use App\Domain\Telemetry\Models\TelemetryEvent;
use App\Domain\Telemetry\Models\VehicleState;
use App\Domain\Trips\Services\TripDerivationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TelemetryIngestionService
{
    public function __construct(
        private readonly TelemetryStateResolver $stateResolver,
        private readonly TripDerivationService $tripDerivationService,
        private readonly GeofenceService $geofenceService,
    ) {
    }

    public function ingest(Vehicle $vehicle, array $payload): array
    {
        return DB::transaction(function () use ($vehicle, $payload) {
            $event = TelemetryEvent::create([
                'company_id' => $vehicle->company_id,
                'vehicle_id' => $vehicle->id,
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

            $currentState = VehicleState::query()
                ->where('vehicle_id', $vehicle->id)
                ->lockForUpdate()
                ->first();

            if (
                $currentState !== null
                && $currentState->last_event_at !== null
                && $event->occurred_at->lt($currentState->last_event_at)
            ) {
                return [$event, $currentState];
            }

            $state = $this->stateResolver->apply($event);
            $this->tripDerivationService->handle($event, $state);
            $this->geofenceService->syncEvent($event, $state);

            EvaluateTelemetryAlertsJob::dispatch($event->id, $state->id);

            return [$event, $state];
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

        $device->forceFill(['last_used_at' => now()])->save();

        return Vehicle::query()
            ->whereKey($device->vehicle_id)
            ->where('company_id', $device->company_id)
            ->firstOrFail();
    }
}
