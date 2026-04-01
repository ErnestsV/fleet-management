<?php

namespace App\Policies;

use App\Domain\Alerts\Models\Alert;
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
}
