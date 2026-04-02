<?php

namespace App\Domain\Fleet\Services;

use App\Domain\Auth\Services\AccountInvitationService;
use App\Domain\Shared\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CompanyUserService
{
    public function __construct(
        private readonly AccountInvitationService $accountInvitationService,
    ) {
    }

    public function create(User $actor, array $data): User
    {
        $companyId = $actor->isSuperAdmin() ? ($data['company_id'] ?? null) : $actor->company_id;

        $user = User::create([
            'company_id' => $companyId,
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'] ?? UserRole::Viewer,
            'timezone' => $data['timezone'] ?? ($actor->timezone ?: 'UTC'),
            'is_active' => $data['is_active'] ?? true,
            // MVP uses temp passwords; invite flow can replace this later without changing user schema.
            'password' => Hash::make($data['password'] ?? Str::password(14)),
        ]);

        $this->accountInvitationService->sendPasswordSetupLink($user);

        return $user;
    }

    public function update(User $actor, User $target, array $data): User
    {
        $role = UserRole::from($data['role']);

        if (! $actor->isSuperAdmin() && in_array($role, [UserRole::SuperAdmin, UserRole::Owner], true)) {
            abort(403, 'This role cannot be assigned.');
        }

        $target->update([
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $role,
            'timezone' => $data['timezone'] ?? $target->timezone,
            'is_active' => $data['is_active'],
            'password' => empty($data['password']) ? $target->password : Hash::make($data['password']),
        ]);

        return $target->refresh();
    }
}
