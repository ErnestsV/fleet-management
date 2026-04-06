<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDriverRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role?->value, ['super_admin', 'owner', 'admin', 'dispatcher'], true);
    }

    public function rules(): array
    {
        return [
            'company_id' => [
                Rule::requiredIf($this->user()?->isSuperAdmin()),
                Rule::prohibitedIf(! $this->user()?->isSuperAdmin()),
                'nullable',
                'integer',
                'exists:companies,id',
            ],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'license_number' => ['nullable', 'string', 'max:255'],
            'license_expires_at' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
