<?php

namespace App\Policies;

use App\Domain\Trips\Models\Trip;
use App\Models\User;

class TripPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role?->canAccessFleetData() ?? false;
    }

    public function view(User $user, Trip $trip): bool
    {
        return ($user->role?->canAccessFleetData() ?? false) && $user->company_id === $trip->company_id;
    }
}
