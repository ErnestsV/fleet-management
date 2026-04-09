<?php

namespace App\Policies;

use App\Domain\Maintenance\Models\MaintenanceSchedule;
use App\Models\User;

class MaintenanceSchedulePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role?->canAccessFleetData() ?? false;
    }

    public function view(User $user, MaintenanceSchedule $schedule): bool
    {
        return ($user->role?->canAccessFleetData() ?? false) && $user->company_id === $schedule->company_id;
    }

    public function create(User $user): bool
    {
        return $user->role?->canManageFleetData() ?? false;
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
