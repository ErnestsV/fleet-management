<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaintenanceRecordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'vehicle_id' => $this->vehicle_id,
            'maintenance_schedule_id' => $this->maintenance_schedule_id,
            'title' => $this->title,
            'service_date' => $this->service_date,
            'odometer_km' => $this->odometer_km,
            'cost_amount' => $this->cost_amount,
            'currency' => $this->currency,
            'notes' => $this->notes,
            'vehicle' => $this->whenLoaded('vehicle', fn () => [
                'id' => $this->vehicle?->id,
                'name' => $this->vehicle?->name,
                'plate_number' => $this->vehicle?->plate_number,
            ]),
        ];
    }
}
