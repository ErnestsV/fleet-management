<?php

namespace App\Policies;

use App\Domain\Telemetry\Models\VehicleState;
use App\Models\User;

class VehicleStatePolicy
{
    public function viewAny(User $user): bool
    {
        return (bool) $user;
    }

    public function view(User $user, VehicleState $vehicleState): bool
    {
        return $user->isSuperAdmin() || $user->company_id === $vehicleState->company_id;
    }
}
