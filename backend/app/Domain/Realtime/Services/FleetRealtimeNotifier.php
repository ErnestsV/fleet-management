<?php

namespace App\Domain\Realtime\Services;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Realtime\Events\CompanyFleetUpdated;
use Illuminate\Support\Facades\DB;

class FleetRealtimeNotifier
{
    /**
     * @param  list<string>  $topics
     */
    public function notifyCompany(int $companyId, array $topics, string $reason, ?int $vehicleId = null): void
    {
        $dispatch = fn () => event(new CompanyFleetUpdated(
            companyId: $companyId,
            topics: array_values(array_unique($topics)),
            reason: $reason,
            vehicleId: $vehicleId,
        ));

        if (DB::transactionLevel() > 0) {
            DB::afterCommit($dispatch);

            return;
        }

        $dispatch();
    }

    public function notifyTelemetryProcessed(int $companyId, int $vehicleId): void
    {
        $this->notifyCompany(
            companyId: $companyId,
            topics: [
                'alerts',
                'assignments',
                'dashboard-summary',
                'driver-insights',
                'drivers',
                'fuel-insights',
                'geofence-analytics',
                'geofences',
                'telemetry-health',
                'trips',
                'vehicles',
            ],
            reason: 'telemetry.processed',
            vehicleId: $vehicleId,
        );
    }

    public function notifyAlertChanged(AlertType $type, int $companyId, ?int $vehicleId, string $reason): void
    {
        $topics = [
            'alerts',
            'dashboard-summary',
            'vehicles',
        ];

        if (in_array($type, AlertType::fuelTypes(), true)) {
            $topics[] = 'fuel-insights';
        }

        if (in_array($type, [AlertType::Speeding, AlertType::ProlongedIdling, AlertType::DriverLicenseExpired], true)) {
            $topics[] = 'driver-insights';
            $topics[] = 'drivers';
        }

        if (in_array($type, [AlertType::GeofenceEntry, AlertType::GeofenceExit], true)) {
            $topics[] = 'geofences';
            $topics[] = 'geofence-analytics';
        }

        if ($type === AlertType::MaintenanceDue) {
            $topics[] = 'maintenance';
        }

        if ($type === AlertType::OfflineVehicle) {
            $topics[] = 'telemetry-health';
        }

        $this->notifyCompany(
            companyId: $companyId,
            topics: $topics,
            reason: $reason,
            vehicleId: $vehicleId,
        );
    }
}
