<?php

namespace App\Domain\Telemetry\Services;

use App\Domain\Telemetry\Enums\VehicleStatus;
use App\Domain\Telemetry\Models\TelemetryEvent;
use App\Domain\Telemetry\Models\VehicleState;
use Illuminate\Support\Carbon;

class TelemetryStateResolver
{
    public function apply(TelemetryEvent $event, ?VehicleState $state = null): VehicleState
    {
        $state ??= VehicleState::firstOrNew([
            'vehicle_id' => $event->vehicle_id,
        ]);

        $status = $this->resolveStatus($event);

        $state->fill([
            'company_id' => $event->company_id,
            'vehicle_id' => $event->vehicle_id,
            'status' => $status,
            'last_event_at' => $event->occurred_at,
            'latitude' => $event->latitude,
            'longitude' => $event->longitude,
            'speed_kmh' => $event->speed_kmh,
            'engine_on' => $event->engine_on,
            'odometer_km' => $event->odometer_km,
            'fuel_level' => $event->fuel_level,
            'heading' => $event->heading,
            'moving_started_at' => $status === VehicleStatus::Moving ? ($state->moving_started_at ?? Carbon::parse($event->occurred_at)) : null,
            'idling_started_at' => $status === VehicleStatus::Idling ? ($state->idling_started_at ?? Carbon::parse($event->occurred_at)) : null,
            'stopped_started_at' => $status === VehicleStatus::Stopped ? ($state->stopped_started_at ?? Carbon::parse($event->occurred_at)) : null,
            'offline_marked_at' => null,
        ]);

        $state->save();

        return $state;
    }

    public function resolveStatus(TelemetryEvent $event): VehicleStatus
    {
        if ($event->engine_on && $event->speed_kmh > 0) {
            return VehicleStatus::Moving;
        }

        if ($event->engine_on && (float) $event->speed_kmh === 0.0) {
            return VehicleStatus::Idling;
        }

        return VehicleStatus::Stopped;
    }
}
