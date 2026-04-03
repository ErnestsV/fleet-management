<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehicleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'name' => $this->name,
            'plate_number' => $this->plate_number,
            'vin' => $this->vin,
            'make' => $this->make,
            'model' => $this->model,
            'year' => $this->year,
            'device_identifier' => $this->device_identifier,
            'is_active' => $this->is_active,
            'deleted_at' => $this->deleted_at,
            'device_token' => $this->whenLoaded('activeDeviceToken', fn () => $this->activeDeviceToken ? [
                'id' => $this->activeDeviceToken->id,
                'name' => $this->activeDeviceToken->name,
                'is_active' => $this->activeDeviceToken->is_active,
                'last_used_at' => $this->activeDeviceToken->last_used_at,
            ] : null),
            'state' => $this->whenLoaded('state', fn () => [
                'status' => $this->state?->status?->value,
                'latitude' => $this->state?->latitude,
                'longitude' => $this->state?->longitude,
                'speed_kmh' => $this->state?->speed_kmh,
                'fuel_level' => $this->state?->fuel_level,
                'heading' => $this->state?->heading,
                'engine_on' => $this->state?->engine_on,
                'last_event_at' => $this->state?->last_event_at,
            ]),
            'assigned_driver' => $this->whenLoaded('assignments', function () {
                $assignment = $this->assignments->sortByDesc('assigned_from')->firstWhere('assigned_until', null)
                    ?? $this->assignments->sortByDesc('assigned_from')->first();

                if (! $assignment?->driver) {
                    return null;
                }

                return [
                    'id' => $assignment->driver->id,
                    'name' => $assignment->driver->name,
                    'assigned_from' => $assignment->assigned_from,
                ];
            }),
            'created_at' => $this->created_at,
        ];
    }
}
