<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TripResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'vehicle_id' => $this->vehicle_id,
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'start_snapshot' => $this->start_snapshot,
            'end_snapshot' => $this->end_snapshot,
            'distance_km' => $this->distance_km,
            'duration_seconds' => $this->duration_seconds,
            'average_speed_kmh' => $this->average_speed_kmh,
            'vehicle' => $this->whenLoaded('vehicle', fn () => [
                'id' => $this->vehicle?->id,
                'name' => $this->vehicle?->name,
                'plate_number' => $this->vehicle?->plate_number,
            ]),
        ];
    }
}
