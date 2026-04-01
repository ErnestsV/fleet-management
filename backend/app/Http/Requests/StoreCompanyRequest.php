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
            'owner.name' => ['nullable', 'string', 'max:255'],
            'owner.email' => ['nullable', 'email'],
            'owner.password' => ['nullable', 'string', 'min:8'],
            'owner.role' => ['nullable', 'in:owner,admin'],
        ];
    }
}
