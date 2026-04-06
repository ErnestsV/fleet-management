<?php

namespace App\Domain\Fleet\Services\Dashboard;

use App\Domain\Alerts\Enums\AlertType;

class DashboardRiskReadService
{
    public function build(array $fleetRows, int $activeAlerts, iterable $alertsByType, array $telemetryHealth, array $fuelAnomalies): array
    {
        $riskItems = [
            $this->buildRiskItem(
                key: 'maintenance_overdue',
                label: 'Maintenance overdue',
                count: $this->countAlertType($alertsByType, AlertType::MaintenanceDue->value),
            ),
            $this->buildRiskItem(
                key: 'active_alerts',
                label: 'Other active alerts',
                count: $this->otherActiveAlertsCount($alertsByType),
            ),
            $this->buildRiskItem(
                key: 'offline_vehicles',
                label: 'Offline vehicles',
                count: (int) ($telemetryHealth['offline_over_24h_count'] ?? 0),
            ),
            $this->buildRiskItem(
                key: 'unassigned_vehicles',
                label: 'Unassigned vehicles',
                count: collect($fleetRows)->filter(fn (array $vehicle) => empty($vehicle['driver']))->count(),
            ),
            $this->buildRiskItem(
                key: 'active_fuel_anomalies',
                label: 'Active fuel anomalies',
                count: (int) ($fuelAnomalies['active_anomalies'] ?? 0),
            ),
        ];

        $highRiskDriverCount = collect($riskItems)->where('severity', 'high')->count();
        $mediumRiskDriverCount = collect($riskItems)->where('severity', 'medium')->count();
        $overallLevel = $this->overallLevel($highRiskDriverCount, $mediumRiskDriverCount);

        return [
            'overall' => [
                'level' => $overallLevel,
                'label' => ucfirst($overallLevel),
                'high_driver_count' => $highRiskDriverCount,
                'medium_driver_count' => $mediumRiskDriverCount,
            ],
            'drivers' => $riskItems,
        ];
    }

    private function buildRiskItem(string $key, string $label, int $count): array
    {
        $thresholds = config("fleet.dashboard_risk_thresholds.$key", []);
        $mediumThreshold = max((int) ($thresholds['medium'] ?? 1), 1);
        $highThreshold = max((int) ($thresholds['high'] ?? $mediumThreshold), $mediumThreshold);
        $severity = $this->severity($count, $mediumThreshold, $highThreshold);

        return [
            'key' => $key,
            'label' => $label,
            'count' => $count,
            'severity' => $severity,
            'thresholds' => [
                'medium' => $mediumThreshold,
                'high' => $highThreshold,
            ],
        ];
    }

    private function severity(int $count, int $mediumThreshold, int $highThreshold): string
    {
        if ($count >= $highThreshold) {
            return 'high';
        }

        if ($count >= $mediumThreshold) {
            return 'medium';
        }

        return 'low';
    }

    private function overallLevel(int $highRiskDriverCount, int $mediumRiskDriverCount): string
    {
        if ($highRiskDriverCount > 0 || $mediumRiskDriverCount >= 3) {
            return 'high';
        }

        if ($mediumRiskDriverCount > 0) {
            return 'medium';
        }

        return 'low';
    }

    private function countAlertType(iterable $alertsByType, string $type): int
    {
        foreach ($alertsByType as $row) {
            if (($row['type'] ?? null) === $type) {
                return (int) ($row['count'] ?? 0);
            }
        }

        return 0;
    }

    private function otherActiveAlertsCount(iterable $alertsByType): int
    {
        $excludedTypes = [
            AlertType::MaintenanceDue->value,
            AlertType::OfflineVehicle->value,
            AlertType::UnexpectedFuelDrop->value,
            AlertType::PossibleFuelTheft->value,
            AlertType::RefuelWithoutTrip->value,
            AlertType::AbnormalFuelConsumption->value,
        ];

        return collect($alertsByType)
            ->reject(fn (array $row) => in_array($row['type'] ?? null, $excludedTypes, true))
            ->sum(fn (array $row) => (int) ($row['count'] ?? 0));
    }
}
