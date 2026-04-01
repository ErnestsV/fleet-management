<?php

namespace App\Policies;

use App\Domain\Geofences\Models\Geofence;
use App\Models\User;

class GeofencePolicy
{
    public function viewAny(User $user): bool
    {
        return (bool) $user;
    }

    public function view(User $user, Geofence $geofence): bool
    {
        return $user->isSuperAdmin() || $user->company_id === $geofence->company_id;
    }

    public function create(User $user): bool
    {
        return in_array($user->role?->value, ['super_admin', 'owner', 'admin', 'dispatcher'], true);
    }

    public function update(User $user, Geofence $geofence): bool
    {
        return $this->create($user) && $this->view($user, $geofence);
    }

    public function delete(User $user, Geofence $geofence): bool
    {
        return $this->update($user, $geofence);
    }
}
