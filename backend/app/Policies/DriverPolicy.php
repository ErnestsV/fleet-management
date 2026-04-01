<?php

namespace App\Policies;

use App\Domain\Fleet\Models\Driver;
use App\Models\User;

class DriverPolicy
{
    public function viewAny(User $user): bool
    {
        return ! is_null($user);
    }

    public function view(User $user, Driver $driver): bool
    {
        return $user->isSuperAdmin() || $user->company_id === $driver->company_id;
    }

    public function create(User $user): bool
    {
        return in_array($user->role?->value, ['super_admin', 'owner', 'admin', 'dispatcher'], true);
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
