<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaintenanceScheduleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'vehicle_id' => $this->vehicle_id,
            'name' => $this->name,
            'interval_days' => $this->interval_days,
            'interval_km' => $this->interval_km,
            'next_due_date' => $this->next_due_date,
            'next_due_odometer_km' => $this->next_due_odometer_km,
            'is_active' => $this->is_active,
            'vehicle' => $this->whenLoaded('vehicle', fn () => [
                'id' => $this->vehicle?->id,
                'name' => $this->vehicle?->name,
                'plate_number' => $this->vehicle?->plate_number,
            ]),
        ];
    }
}
