<?php

namespace App\Http\Resources;

use App\Domain\Companies\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var \App\Models\User $user */
        $user = $this->resource;

        return [
            'id' => $user->id,
            'company_id' => $user->company_id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role?->value,
            'timezone' => $user->timezone,
            'is_active' => $user->is_active,
            'company' => $this->whenLoaded('company', function () use ($user) {
                /** @var Company|null $loadedCompany */
                $loadedCompany = $user->company;

                return [
                    'id' => $loadedCompany?->id,
                    'name' => $loadedCompany?->name,
                    'timezone' => $loadedCompany?->timezone,
                    'is_active' => $loadedCompany?->is_active,
                    'settings' => [
                        'speed_alert_threshold_kmh' => $loadedCompany?->speedAlertThresholdKmh(),
                    ],
                ];
            }),
            'created_at' => $user->created_at,
        ];
    }
}
