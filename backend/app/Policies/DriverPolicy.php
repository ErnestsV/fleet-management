<?php

namespace App\Policies;

use App\Domain\Fleet\Models\Driver;
use App\Models\User;

class DriverPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role?->canAccessFleetData() ?? false;
    }

    public function view(User $user, Driver $driver): bool
    {
        return ($user->role?->canAccessFleetData() ?? false) && $user->company_id === $driver->company_id;
    }

    public function create(User $user): bool
    {
        return $user->role?->canManageFleetData() ?? false;
    }

    public function update(User $user, Driver $driver): bool
    {
        return $this->view($user, $driver) && $this->create($user);
    }

    public function delete(User $user, Driver $driver): bool
    {
        return $this->update($user, $driver);
    }
}
