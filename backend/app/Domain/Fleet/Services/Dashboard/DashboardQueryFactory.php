<?php

namespace App\Domain\Fleet\Services\Dashboard;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Alerts\Models\Alert;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Telemetry\Models\TelemetryEvent;
use App\Domain\Telemetry\Models\VehicleState;
use App\Domain\Trips\Models\Trip;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class DashboardQueryFactory
{
    private const INFORMATIONAL_ALERT_TYPES = [
        AlertType::GeofenceEntry,
        AlertType::GeofenceExit,
    ];

    private const DASHBOARD_HEADLINE_EXCLUDED_ALERT_TYPES = [
        AlertType::GeofenceExit,
    ];

    public function informationalAlertTypes(): array
    {
        return self::INFORMATIONAL_ALERT_TYPES;
    }

    public function activeActionableAlertsQuery(?int $companyId, User $user)
    {
        return $this->scopeToCompany(Alert::query(), $companyId, $user)
            ->whereNull('resolved_at')
            ->whereNotIn('type', self::INFORMATIONAL_ALERT_TYPES);
    }

    public function activeDashboardHeadlineAlertsQuery(?int $companyId, User $user)
    {
        return $this->scopeToCompany(Alert::query(), $companyId, $user)
            ->whereNull('resolved_at')
            ->whereNotIn('type', self::DASHBOARD_HEADLINE_EXCLUDED_ALERT_TYPES);
    }

    public function fleetVehiclesQuery(?int $companyId, User $user)
    {
        return $this->scopeToCompany(Vehicle::query(), $companyId, $user)
            ->with(['state', 'assignments.driver']);
    }

    public function tripQuery(?int $companyId, User $user)
    {
        return $this->scopeToCompany(Trip::query(), $companyId, $user);
    }

    public function telemetryQuery(?int $companyId, User $user)
    {
        return $this->scopeToCompany(TelemetryEvent::query(), $companyId, $user);
    }

    public function stateQuery(?int $companyId, User $user)
    {
        return $this->scopeToCompany(VehicleState::query(), $companyId, $user);
    }

    public function vehicleQuery(?int $companyId, User $user)
    {
        return $this->scopeToCompany(Vehicle::query(), $companyId, $user);
    }

    private function scopeToCompany(Builder $query, ?int $companyId, User $user): Builder
    {
        if ($user->isSuperAdmin()) {
            return $query;
        }

        if ($companyId === null) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where('company_id', $companyId);
    }
}
