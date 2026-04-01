<?php

namespace App\Policies;

use App\Domain\Fleet\Models\Vehicle;
use App\Models\User;

class VehiclePolicy
{
    public function viewAny(User $user): bool
    {
        return ! is_null($user);
    }

    public function view(User $user, Vehicle $vehicle): bool
    {
        return $user->isSuperAdmin() || $user->company_id === $vehicle->company_id;
    }

    public function create(User $user): bool
    {
        return in_array($user->role?->value, ['super_admin', 'owner', 'admin', 'dispatcher'], true);
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
