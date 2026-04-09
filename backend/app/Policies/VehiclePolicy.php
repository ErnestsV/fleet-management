<?php

namespace App\Policies;

use App\Domain\Fleet\Models\Vehicle;
use App\Models\User;

class VehiclePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role?->canAccessFleetData() ?? false;
    }

    public function view(User $user, Vehicle $vehicle): bool
    {
        return ($user->role?->canAccessFleetData() ?? false) && $user->company_id === $vehicle->company_id;
    }

    public function create(User $user): bool
    {
        return $user->role?->canManageFleetData() ?? false;
    }

    public function update(User $user, Vehicle $vehicle): bool
    {
        return $this->view($user, $vehicle) && $this->create($user);
    }

    public function delete(User $user, Vehicle $vehicle): bool
    {
        return $this->update($user, $vehicle);
    }
}
