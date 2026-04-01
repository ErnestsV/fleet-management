<?php

namespace App\Domain\Geofences\Services;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Alerts\Models\Alert;
use App\Domain\Geofences\Models\Geofence;
use App\Domain\Telemetry\Models\TelemetryEvent;
use App\Domain\Telemetry\Models\VehicleState;

class GeofenceService
{
    public function syncEvent(TelemetryEvent $event, VehicleState $state): void
    {
        $activeGeofences = Geofence::query()
            ->where('company_id', $event->company_id)
            ->where('is_active', true)
            ->get();

        $previous = collect($state->last_geofence_ids ?? []);
        $current = $activeGeofences
            ->filter(fn (Geofence $geofence) => $this->contains($geofence, (float) $event->latitude, (float) $event->longitude))
            ->pluck('id');

        $entered = $current->diff($previous);
        $exited = $previous->diff($current);

        foreach ($entered as $geofenceId) {
            $this->createAlert($event, AlertType::GeofenceEntry, (int) $geofenceId);
        }

        foreach ($exited as $geofenceId) {
            $this->createAlert($event, AlertType::GeofenceExit, (int) $geofenceId);
        }

        $state->update(['last_geofence_ids' => $current->values()->all()]);
    }

    public function createOrUpdate(?Geofence $geofence, array $data): Geofence
    {
        $payload = [
            'company_id' => $data['company_id'],
            'name' => $data['name'],
            'type' => $data['type'],
            'geometry' => $data['geometry'],
            'is_active' => $data['is_active'] ?? true,
        ];

        if ($geofence) {
            $geofence->update($payload);
            return $geofence->refresh();
        }

        return Geofence::create($payload);
    }

    private function contains(Geofence $geofence, float $latitude, float $longitude): bool
    {
        if (($geofence->type?->value ?? $geofence->type) !== 'circle') {
            return false;
        }

        $centerLat = (float) data_get($geofence->geometry, 'center.lat');
        $centerLng = (float) data_get($geofence->geometry, 'center.lng');
        $radiusMeters = (float) data_get($geofence->geometry, 'radius_m');

        return $this->distanceMeters($centerLat, $centerLng, $latitude, $longitude) <= $radiusMeters;
    }

    private function distanceMeters(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000;
        $latDelta = deg2rad($lat2 - $lat1);
        $lngDelta = deg2rad($lng2 - $lng1);

        $a = sin($latDelta / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($lngDelta / 2) ** 2;

        return 2 * $earthRadius * asin(min(1, sqrt($a)));
    }

    private function createAlert(TelemetryEvent $event, AlertType $type, int $geofenceId): void
    {
        Alert::create([
            'company_id' => $event->company_id,
            'vehicle_id' => $event->vehicle_id,
            'type' => $type,
            'severity' => 'medium',
            'message' => $type === AlertType::GeofenceEntry ? 'Vehicle entered a geofence.' : 'Vehicle exited a geofence.',
            'triggered_at' => now(),
            'context' => ['geofence_id' => $geofenceId],
        ]);
    }
}
