<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehicleStateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'vehicle_id' => $this->vehicle_id,
            'company_id' => $this->company_id,
            'status' => $this->status?->value,
            'last_event_at' => $this->last_event_at,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'speed_kmh' => $this->speed_kmh,
            'engine_on' => $this->engine_on,
            'odometer_km' => $this->odometer_km,
            'fuel_level' => $this->fuel_level,
        ];
    }
}
