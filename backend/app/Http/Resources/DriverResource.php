<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DriverResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'license_number' => $this->license_number,
            'license_expires_at' => $this->license_expires_at,
            'is_active' => $this->is_active,
            'deleted_at' => $this->deleted_at,
            'assigned_vehicle' => $this->whenLoaded('assignments', function () {
                $assignment = $this->assignments->sortByDesc('assigned_from')->firstWhere('assigned_until', null)
                    ?? $this->assignments->sortByDesc('assigned_from')->first();

                if (! $assignment?->vehicle) {
                    return null;
                }

                return [
                    'id' => $assignment->vehicle->id,
                    'name' => $assignment->vehicle->name,
                    'plate_number' => $assignment->vehicle->plate_number,
                    'assigned_from' => $assignment->assigned_from,
                ];
            }),
        ];
    }
}
