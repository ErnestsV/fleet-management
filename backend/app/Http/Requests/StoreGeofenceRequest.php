<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGeofenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role?->value, ['super_admin', 'owner', 'admin', 'dispatcher'], true);
    }

    public function rules(): array
    {
        return [
            'company_id' => ['nullable', 'integer', 'exists:companies,id'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:circle,polygon'],
            'geometry' => ['required', 'array'],
            'geometry.center.lat' => ['required_if:type,circle', 'numeric', 'between:-90,90'],
            'geometry.center.lng' => ['required_if:type,circle', 'numeric', 'between:-180,180'],
            'geometry.radius_m' => ['required_if:type,circle', 'numeric', 'min:1'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
