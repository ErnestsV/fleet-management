<?php

namespace App\Policies;

use App\Domain\Maintenance\Models\MaintenanceSchedule;
use App\Models\User;

class MaintenanceSchedulePolicy
{
    public function viewAny(User $user): bool
    {
        return (bool) $user;
    }

    public function view(User $user, MaintenanceSchedule $schedule): bool
    {
        return $user->isSuperAdmin() || $user->company_id === $schedule->company_id;
    }

    public function create(User $user): bool
    {
        return in_array($user->role?->value, ['super_admin', 'owner', 'admin', 'dispatcher'], true);
    }

    public function update(User $user, MaintenanceSchedule $schedule): bool
    {
        return $this->create($user) && $this->view($user, $schedule);
    }

    public function delete(User $user, MaintenanceSchedule $schedule): bool
    {
        return $this->update($user, $schedule);
    }
}
