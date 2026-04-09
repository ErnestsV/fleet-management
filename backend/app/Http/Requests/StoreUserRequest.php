<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role?->canManageUsers() ?? false;
    }

    public function rules(): array
    {
        $roles = ['admin', 'dispatcher', 'viewer'];

        return [
            'company_id' => ['nullable', 'integer', 'exists:companies,id'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['nullable', 'string', 'min:8'],
            'timezone' => ['nullable', 'string', 'max:64'],
            'is_active' => ['nullable', 'boolean'],
            'role' => ['required', 'in:'.implode(',', $roles)],
        ];
    }
}
