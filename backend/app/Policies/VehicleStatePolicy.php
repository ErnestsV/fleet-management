<?php

namespace App\Policies;

use App\Domain\Telemetry\Models\VehicleState;
use App\Models\User;

class VehicleStatePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role?->canAccessFleetData() ?? false;
    }

    public function view(User $user, VehicleState $vehicleState): bool
    {
        return ($user->role?->canAccessFleetData() ?? false) && $user->company_id === $vehicleState->company_id;
    }
}
