<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role?->value,
            'timezone' => $this->timezone,
            'is_active' => $this->is_active,
            'company' => $this->whenLoaded('company', fn () => [
                'id' => $this->company?->id,
                'name' => $this->company?->name,
                'timezone' => $this->company?->timezone,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
