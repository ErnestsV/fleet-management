<?php

namespace App\Domain\Fleet\Services\Dashboard;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Alerts\Models\Alert;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Telemetry\Models\TelemetryEvent;
use App\Domain\Telemetry\Models\VehicleState;
use App\Domain\Trips\Models\Trip;
use App\Models\User;

class DashboardQueryFactory
{
    private const INFORMATIONAL_ALERT_TYPES = [
        AlertType::GeofenceEntry,
        AlertType::GeofenceExit,
    ];

    public function informationalAlertTypes(): array
    {
        return self::INFORMATIONAL_ALERT_TYPES;
    }

    public function activeActionableAlertsQuery(?int $companyId, User $user)
    {
        return Alert::query()
            ->whereNull('resolved_at')
            ->whereNotIn('type', self::INFORMATIONAL_ALERT_TYPES)
            ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('company_id', $companyId));
    }

    public function fleetVehiclesQuery(?int $companyId, User $user)
    {
        return Vehicle::query()
            ->with(['state', 'assignments.driver'])
            ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('company_id', $companyId));
    }

    public function tripQuery(?int $companyId, User $user)
    {
        return Trip::query()
            ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('company_id', $companyId));
    }

    public function telemetryQuery(?int $companyId, User $user)
    {
        return TelemetryEvent::query()
            ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('company_id', $companyId));
    }

    public function stateQuery(?int $companyId, User $user)
    {
        return VehicleState::query()
            ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('company_id', $companyId));
    }

    public function vehicleQuery(?int $companyId, User $user)
    {
        return Vehicle::query()
            ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('company_id', $companyId));
    }
}
