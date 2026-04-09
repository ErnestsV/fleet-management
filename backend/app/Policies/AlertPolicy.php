<?php

namespace App\Policies;

use App\Domain\Alerts\Models\Alert;
use App\Domain\Shared\Enums\UserRole;
use App\Models\User;

class AlertPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role?->canAccessFleetData() ?? false;
    }

    public function view(User $user, Alert $alert): bool
    {
        return ($user->role?->canAccessFleetData() ?? false) && $user->company_id === $alert->company_id;
    }

    public function resolve(User $user, Alert $alert): bool
    {
        return $user->company_id === $alert->company_id
            && in_array($user->role, [UserRole::Owner, UserRole::Admin], true);
    }
}
