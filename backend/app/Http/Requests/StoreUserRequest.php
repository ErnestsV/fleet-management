<?php

namespace App\Http\Requests;

use App\Domain\Shared\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role?->canManageUsers() ?? false;
    }

    public function rules(): array
    {
        $roles = $this->user()?->isSuperAdmin()
            ? collect(UserRole::cases())->map->value->all()
            : ['admin', 'dispatcher', 'viewer'];

        return [
            'company_id' => [
                Rule::requiredIf(
                    $this->user()?->isSuperAdmin() && $this->input('role') !== UserRole::SuperAdmin->value
                ),
                'nullable',
                'integer',
                'exists:companies,id',
            ],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['nullable', 'string', 'min:8'],
            'timezone' => ['nullable', 'string', 'max:64'],
            'is_active' => ['nullable', 'boolean'],
            'role' => ['required', 'in:'.implode(',', $roles)],
        ];
    }
}
