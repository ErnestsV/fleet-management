<?php

namespace App\Policies;

use App\Domain\Fleet\Models\VehicleDriverAssignment;
use App\Models\User;

class VehicleDriverAssignmentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role?->canAccessFleetData() ?? false;
    }

    public function create(User $user): bool
    {
        return $user->role?->canManageFleetData() ?? false;
    }

    public function update(User $user, VehicleDriverAssignment $assignment): bool
    {
        return $this->create($user) && $user->company_id === $assignment->company_id;
    }
}
