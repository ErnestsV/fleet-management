<?php

namespace App\Policies;

use App\Domain\Maintenance\Models\MaintenanceRecord;
use App\Models\User;

class MaintenanceRecordPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role?->canAccessFleetData() ?? false;
    }

    public function view(User $user, MaintenanceRecord $record): bool
    {
        return ($user->role?->canAccessFleetData() ?? false) && $user->company_id === $record->company_id;
    }

    public function create(User $user): bool
    {
        return $user->role?->canManageFleetData() ?? false;
    }

    public function update(User $user, MaintenanceRecord $record): bool
    {
        return $this->create($user) && $this->view($user, $record);
    }

    public function delete(User $user, MaintenanceRecord $record): bool
    {
        return $this->update($user, $record);
    }
}
