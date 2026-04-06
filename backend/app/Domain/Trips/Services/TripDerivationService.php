<?php

namespace App\Domain\Trips\Services;

use App\Domain\Telemetry\Enums\VehicleStatus;
use App\Domain\Telemetry\Models\TelemetryEvent;
use App\Domain\Telemetry\Models\VehicleState;
use App\Domain\Trips\Models\Trip;
use Illuminate\Support\Carbon;

class TripDerivationService
{
    /**
     * Current derivation assumptions:
     * - A trip starts on the first moving event when no open trip exists.
     * - A trip remains open while the vehicle is moving.
     * - A trip closes on the first non-moving event after movement.
     * - Distance prefers odometer deltas, falling back to point-to-point approximation later if needed.
     */
    public function handle(TelemetryEvent $event, VehicleState $state): ?Trip
    {
        $latestTrip = $this->latestTripForDerivation($event->vehicle_id);

        if ($this->isOutOfOrderForTripDerivation($event, $latestTrip)) {
            return null;
        }

        $openTrip = Trip::query()
            ->where('vehicle_id', $event->vehicle_id)
            ->whereNull('end_time')
            ->latest('start_time')
            ->first();

        if ($state->status === VehicleStatus::Moving) {
            if (! $openTrip) {
                return Trip::create([
                    'company_id' => $event->company_id,
                    'vehicle_id' => $event->vehicle_id,
                    'start_time' => $event->occurred_at,
                    'start_snapshot' => $this->snapshot($event),
                ]);
            }

            $this->updateOpenTrip($openTrip, $event);

            return $openTrip->refresh();
        }

        if ($openTrip) {
            $this->closeTrip($openTrip, $event);

            return $openTrip->refresh();
        }

        return null;
    }

    public function updateOpenTrip(Trip $trip, TelemetryEvent $event): void
    {
        $distance = $trip->distance_km;

        if ($event->odometer_km !== null) {
            $startOdometer = data_get($trip->start_snapshot, 'odometer_km');

            if ($startOdometer !== null && $event->odometer_km >= $startOdometer) {
                $distance = round($event->odometer_km - $startOdometer, 2);
            }
        }

        $duration = Carbon::parse($trip->start_time)->diffInSeconds($event->occurred_at);
        $averageSpeed = $duration > 0 ? round(($distance / ($duration / 3600)), 2) : 0;

        $trip->update([
            'end_snapshot' => $this->snapshot($event),
            'distance_km' => $distance,
            'duration_seconds' => $duration,
            'average_speed_kmh' => $averageSpeed,
        ]);
    }

    public function closeTrip(Trip $trip, TelemetryEvent $event): void
    {
        $this->updateOpenTrip($trip, $event);

        $trip->update([
            'end_time' => $event->occurred_at,
            'end_snapshot' => $this->snapshot($event),
        ]);
    }

    private function snapshot(TelemetryEvent $event): array
    {
        return [
            'timestamp' => $event->occurred_at,
            'latitude' => $event->latitude,
            'longitude' => $event->longitude,
            'speed_kmh' => $event->speed_kmh,
            'odometer_km' => $event->odometer_km,
        ];
    }

    private function isOutOfOrderForTripDerivation(TelemetryEvent $event, ?Trip $latestTrip): bool
    {
        if (! $latestTrip) {
            return false;
        }

        $latestDerivedAt = collect([
            $latestTrip->end_time,
            data_get($latestTrip->end_snapshot, 'timestamp'),
            data_get($latestTrip->start_snapshot, 'timestamp'),
            $latestTrip->start_time,
        ])
            ->filter()
            ->map(fn ($timestamp) => $timestamp instanceof Carbon ? $timestamp : Carbon::parse($timestamp))
            ->sort()
            ->last();

        return $latestDerivedAt !== null && $event->occurred_at->lt($latestDerivedAt);
    }

    private function latestTripForDerivation(int $vehicleId): ?Trip
    {
        return Trip::query()
            ->where('vehicle_id', $vehicleId)
            ->latest('start_time')
            ->first();
    }
}
