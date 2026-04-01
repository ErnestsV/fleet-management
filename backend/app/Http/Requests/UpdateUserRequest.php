<?php

namespace App\Http\Requests;

use App\Domain\Shared\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var User $target */
        $target = $this->route('user');

        return $this->user()?->can('update', $target) ?? false;
    }

    public function rules(): array
    {
        /** @var User $target */
        $target = $this->route('user');

        $roles = $this->user()?->isSuperAdmin()
            ? collect(UserRole::cases())->map->value->all()
            : ['admin', 'dispatcher', 'viewer'];

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($target->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'timezone' => ['nullable', 'string', 'max:64'],
            'is_active' => ['required', 'boolean'],
            'role' => ['required', 'in:'.implode(',', $roles)],
        ];
    }
}
