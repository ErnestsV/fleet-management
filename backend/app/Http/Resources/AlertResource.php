<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AlertResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'type' => $this->type?->value,
            'severity' => $this->severity,
            'message' => $this->message,
            'triggered_at' => $this->triggered_at,
            'resolved_at' => $this->resolved_at,
            'status' => $this->resolved_at ? 'resolved' : 'active',
            'vehicle' => $this->whenLoaded('vehicle', fn () => [
                'id' => $this->vehicle?->id,
                'name' => $this->vehicle?->name,
                'plate_number' => $this->vehicle?->plate_number,
            ]),
            'rule' => $this->whenLoaded('rule', fn () => [
                'id' => $this->rule?->id,
                'name' => $this->rule?->name,
            ]),
            'context' => $this->context,
        ];
    }
}
