<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'timezone' => ['nullable', 'string', 'max:64'],
            'is_active' => ['boolean'],
            'settings' => ['nullable', 'array'],
            'settings.speed_alert_threshold_kmh' => ['nullable', 'numeric', 'min:1', 'max:300'],
            'owner' => ['nullable', 'array'],
            'owner.name' => ['required_with:owner', 'string', 'max:255'],
            'owner.email' => ['required_with:owner', 'email'],
            'owner.password' => ['nullable', 'string', 'min:8'],
            'owner.role' => ['nullable', 'in:owner,admin'],
        ];
    }
}
