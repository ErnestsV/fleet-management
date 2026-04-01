<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehicleDriverAssignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'vehicle_id' => $this->vehicle_id,
            'driver_id' => $this->driver_id,
            'assigned_from' => $this->assigned_from,
            'assigned_until' => $this->assigned_until,
            'vehicle' => $this->whenLoaded('vehicle', fn () => [
                'id' => $this->vehicle?->id,
                'name' => $this->vehicle?->name,
                'plate_number' => $this->vehicle?->plate_number,
            ]),
            'driver' => $this->whenLoaded('driver', fn () => [
                'id' => $this->driver?->id,
                'name' => $this->driver?->name,
            ]),
        ];
    }
}
