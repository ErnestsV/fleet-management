<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role?->canManageUsers() ?? false;
    }

    public function view(User $user, User $target): bool
    {
        return $user->isSuperAdmin() || $user->company_id === $target->company_id;
    }

    public function create(User $user): bool
    {
        return $user->role?->canManageUsers() ?? false;
    }

    public function update(User $user, User $target): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->company_id !== $target->company_id || ! $user->role?->canManageUsers()) {
            return false;
        }

        if ($target->role === \App\Domain\Shared\Enums\UserRole::SuperAdmin) {
            return false;
        }

        if ($user->role === \App\Domain\Shared\Enums\UserRole::Admin && $target->role === \App\Domain\Shared\Enums\UserRole::Owner) {
            return false;
        }

        return true;
    }

    public function delete(User $user, User $target): bool
    {
        return $this->update($user, $target);
    }
}
