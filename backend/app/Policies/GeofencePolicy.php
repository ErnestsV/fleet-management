<?php

namespace App\Policies;

use App\Domain\Geofences\Models\Geofence;
use App\Models\User;

class GeofencePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role?->canAccessFleetData() ?? false;
    }

    public function view(User $user, Geofence $geofence): bool
    {
        return ($user->role?->canAccessFleetData() ?? false) && $user->company_id === $geofence->company_id;
    }

    public function create(User $user): bool
    {
        return $user->role?->canManageFleetData() ?? false;
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
