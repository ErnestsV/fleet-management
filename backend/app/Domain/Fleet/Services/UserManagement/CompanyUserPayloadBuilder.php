<?php

namespace App\Domain\Fleet\Services\UserManagement;

use App\Domain\Shared\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CompanyUserPayloadBuilder
{
    public function buildCreatePayload(User $actor, array $data): array
    {
        $role = isset($data['role']) ? UserRole::from($data['role']) : UserRole::Viewer;

        return [
            'company_id' => $actor->isSuperAdmin() ? ($data['company_id'] ?? null) : $actor->company_id,
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $role,
            'timezone' => $data['timezone'] ?? ($actor->timezone ?: 'UTC'),
            'is_active' => $data['is_active'] ?? true,
            // Invite flow still owns the real password setup; this only provisions a safe placeholder.
            'password' => Hash::make($data['password'] ?? Str::password(14)),
        ];
    }

    public function buildUpdatePayload(User $target, array $data): array
    {
        return [
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => UserRole::from($data['role']),
            'timezone' => $data['timezone'] ?? $target->timezone,
            'is_active' => $data['is_active'],
            'password' => empty($data['password']) ? $target->password : Hash::make($data['password']),
        ];
    }
}
