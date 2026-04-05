<?php

namespace App\Policies;

use App\Domain\Alerts\Models\Alert;
use App\Domain\Shared\Enums\UserRole;
use App\Models\User;

class AlertPolicy
{
    public function viewAny(User $user): bool
    {
        return (bool) $user;
    }

    public function view(User $user, Alert $alert): bool
    {
        return $user->isSuperAdmin() || $user->company_id === $alert->company_id;
    }

    public function resolve(User $user, Alert $alert): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return $user->company_id === $alert->company_id
            && in_array($user->role, [UserRole::Owner, UserRole::Admin], true);
    }
}
