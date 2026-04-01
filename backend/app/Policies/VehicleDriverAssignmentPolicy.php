<?php

namespace App\Policies;

use App\Domain\Fleet\Models\VehicleDriverAssignment;
use App\Models\User;

class VehicleDriverAssignmentPolicy
{
    public function viewAny(User $user): bool
    {
        return (bool) $user;
    }

    public function create(User $user): bool
    {
        return in_array($user->role?->value, ['super_admin', 'owner', 'admin', 'dispatcher'], true);
    }

    public function update(User $user, VehicleDriverAssignment $assignment): bool
    {
        return $this->create($user) && ($user->isSuperAdmin() || $user->company_id === $assignment->company_id);
    }
}
