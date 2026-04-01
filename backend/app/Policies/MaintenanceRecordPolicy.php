<?php

namespace App\Policies;

use App\Domain\Maintenance\Models\MaintenanceRecord;
use App\Models\User;

class MaintenanceRecordPolicy
{
    public function viewAny(User $user): bool
    {
        return (bool) $user;
    }

    public function view(User $user, MaintenanceRecord $record): bool
    {
        return $user->isSuperAdmin() || $user->company_id === $record->company_id;
    }

    public function create(User $user): bool
    {
        return in_array($user->role?->value, ['super_admin', 'owner', 'admin', 'dispatcher'], true);
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
