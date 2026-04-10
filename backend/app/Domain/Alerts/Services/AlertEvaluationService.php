<?php

namespace App\Domain\Alerts\Services;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Alerts\Models\Alert;
use App\Domain\Companies\Models\Company;
use App\Domain\Fleet\Models\Driver;
use App\Domain\Maintenance\Models\MaintenanceSchedule;
use App\Domain\Realtime\Services\FleetRealtimeNotifier;
use App\Domain\Telemetry\Enums\VehicleStatus;
use App\Domain\Telemetry\Models\TelemetryEvent;
use App\Domain\Telemetry\Models\VehicleState;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

class AlertEvaluationService
{
    public function __construct(
        private readonly FleetRealtimeNotifier $fleetRealtimeNotifier,
    ) {
    }

    public function evaluateTelemetry(TelemetryEvent $event, VehicleState $state): void
    {
        $this->evaluateFuelAnomalies($event, $state);
        $speedThresholdKmh = $this->speedAlertThresholdKmh($event->company_id);

        if ($event->speed_kmh > $speedThresholdKmh) {
            $this->createAlert(
                type: AlertType::Speeding,
                vehicleId: $event->vehicle_id,
                companyId: $event->company_id,
                message: 'Vehicle exceeded the configured speed threshold.',
                context: [
                    'speed_kmh' => $event->speed_kmh,
                    'threshold_kmh' => $speedThresholdKmh,
                ]
            );
        } else {
            $this->resolveSpeedingAlertsIfRecovered($event, $speedThresholdKmh);
        }

        if ($state->status === VehicleStatus::Idling && $state->idling_started_at?->diffInMinutes($event->occurred_at) >= 15) {
            $this->createAlert(
                type: AlertType::ProlongedIdling,
                vehicleId: $event->vehicle_id,
                companyId: $event->company_id,
                message: 'Vehicle has been idling longer than the allowed threshold.',
                context: ['idling_started_at' => $state->idling_started_at]
            );
        }

        MaintenanceSchedule::query()
            ->where('company_id', $event->company_id)
            ->where('vehicle_id', $event->vehicle_id)
            ->where('is_active', true)
            ->each(fn (MaintenanceSchedule $schedule) => $this->evaluateMaintenanceSchedule($schedule, $event->odometer_km));
    }

    private function evaluateFuelAnomalies(TelemetryEvent $event, VehicleState $state): void
    {
        if ($event->fuel_level === null || $event->odometer_km === null) {
            return;
        }

        $previousEvent = TelemetryEvent::query()
            ->where('vehicle_id', $event->vehicle_id)
            ->where('occurred_at', '<', $event->occurred_at)
            ->whereNotNull('fuel_level')
            ->whereNotNull('odometer_km')
            ->latest('occurred_at')
            ->latest('id')
            ->first();

        if (! $previousEvent) {
            return;
        }

        $timeDeltaMinutes = max(1, $previousEvent->occurred_at->diffInMinutes($event->occurred_at));

        if ($timeDeltaMinutes > (int) config('fleet.fuel_anomaly_window_minutes', 120)) {
            return;
        }

        $distanceDeltaKm = max(0, $event->odometer_km - $previousEvent->odometer_km);
        $fuelDeltaPct = $event->fuel_level - $previousEvent->fuel_level;
        $stationaryDistanceKm = (float) config('fleet.fuel_stationary_distance_km', 1);
        $isStationaryWindow = $distanceDeltaKm <= $stationaryDistanceKm;
        $expectedConsumption = (float) config('fleet.expected_fuel_consumption_l_per_100km', 28);
        $tankCapacityLiters = (float) config('fleet.estimated_tank_capacity_liters', 100);

        if ($fuelDeltaPct <= -1) {
            $fuelDropPct = abs($fuelDeltaPct);

            if ($isStationaryWindow && $fuelDropPct >= (float) config('fleet.fuel_unexpected_drop_pct', 8)) {
                $this->createAlert(
                    type: AlertType::UnexpectedFuelDrop,
                    vehicleId: $event->vehicle_id,
                    companyId: $event->company_id,
                    message: 'Fuel level dropped sharply without corresponding vehicle movement.',
                    context: $this->fuelAnomalyContext($previousEvent, $event, $distanceDeltaKm, $timeDeltaMinutes)
                );
            }

            if (
                $isStationaryWindow
                && $fuelDropPct >= (float) config('fleet.fuel_possible_theft_drop_pct', 12)
                && $this->looksStationaryAtFuelEvent($event, $state)
            ) {
                $this->createAlert(
                    type: AlertType::PossibleFuelTheft,
                    vehicleId: $event->vehicle_id,
                    companyId: $event->company_id,
                    message: 'Fuel level dropped while the vehicle appeared stationary, suggesting possible fuel theft.',
                    context: $this->fuelAnomalyContext($previousEvent, $event, $distanceDeltaKm, $timeDeltaMinutes)
                );
            }

            if (
                $distanceDeltaKm >= (float) config('fleet.fuel_min_distance_for_consumption_km', 10)
                && $expectedConsumption > 0
                && $tankCapacityLiters > 0
            ) {
                $estimatedFuelUsedLiters = ($fuelDropPct / 100) * $tankCapacityLiters;
                $estimatedConsumption = ($estimatedFuelUsedLiters / $distanceDeltaKm) * 100;

                if ($estimatedConsumption >= $expectedConsumption * (float) config('fleet.fuel_abnormal_consumption_multiplier', 1.8)) {
                    $this->createAlert(
                        type: AlertType::AbnormalFuelConsumption,
                        vehicleId: $event->vehicle_id,
                        companyId: $event->company_id,
                        message: 'Estimated fuel consumption materially exceeded the configured fleet baseline.',
                        context: array_merge(
                            $this->fuelAnomalyContext($previousEvent, $event, $distanceDeltaKm, $timeDeltaMinutes),
                            [
                                'estimated_fuel_used_l' => round($estimatedFuelUsedLiters, 2),
                                'estimated_consumption_l_per_100km' => round($estimatedConsumption, 1),
                                'expected_consumption_l_per_100km' => round($expectedConsumption, 1),
                            ]
                        )
                    );
                }
            }
        }

        if (
            $fuelDeltaPct >= (float) config('fleet.fuel_refuel_increase_pct', 10)
            && $isStationaryWindow
        ) {
            $this->createAlert(
                type: AlertType::RefuelWithoutTrip,
                vehicleId: $event->vehicle_id,
                companyId: $event->company_id,
                message: 'Fuel level increased without a meaningful trip between telemetry samples.',
                context: $this->fuelAnomalyContext($previousEvent, $event, $distanceDeltaKm, $timeDeltaMinutes)
            );
        }
    }

    private function fuelAnomalyContext(
        TelemetryEvent $previousEvent,
        TelemetryEvent $event,
        float $distanceDeltaKm,
        int $timeDeltaMinutes,
    ): array {
        return [
            'previous_event_at' => $previousEvent->occurred_at->toIso8601String(),
            'current_event_at' => $event->occurred_at->toIso8601String(),
            'previous_fuel_level' => round((float) $previousEvent->fuel_level, 1),
            'current_fuel_level' => round((float) $event->fuel_level, 1),
            'fuel_delta_pct' => round((float) $event->fuel_level - (float) $previousEvent->fuel_level, 1),
            'distance_delta_km' => round($distanceDeltaKm, 2),
            'time_delta_minutes' => $timeDeltaMinutes,
        ];
    }

    private function looksStationaryAtFuelEvent(TelemetryEvent $event, VehicleState $state): bool
    {
        return ! $event->engine_on
            || $event->speed_kmh <= 1
            || in_array($state->status, [VehicleStatus::Stopped, VehicleStatus::Idling, VehicleStatus::Offline], true);
    }

    public function markOffline(VehicleState $state): void
    {
        if ($state->status === VehicleStatus::Offline) {
            return;
        }

        $state->forceFill([
            'status' => VehicleStatus::Offline,
            'offline_marked_at' => Carbon::now(),
        ])->save();

        $this->createAlert(
            type: AlertType::OfflineVehicle,
            vehicleId: $state->vehicle_id,
            companyId: $state->company_id,
            message: 'Vehicle has gone offline.',
            context: ['last_event_at' => $state->last_event_at]
        );
    }

    public function resolveOfflineAlerts(int $companyId, int $vehicleId): void
    {
        $updated = Alert::query()
            ->where('company_id', $companyId)
            ->where('vehicle_id', $vehicleId)
            ->where('type', AlertType::OfflineVehicle)
            ->whereNull('resolved_at')
            ->update(['resolved_at' => now()]);

        if ($updated > 0) {
            $this->fleetRealtimeNotifier->notifyAlertChanged(
                type: AlertType::OfflineVehicle,
                companyId: $companyId,
                vehicleId: $vehicleId,
                reason: 'alert.resolved',
            );
        }
    }

    public function evaluateMaintenanceSchedule(MaintenanceSchedule $schedule, ?float $currentOdometerKm = null): void
    {
        $dateDue = $schedule->next_due_date && $schedule->next_due_date->startOfDay()->lte(today());
        $odometerDue = $schedule->next_due_odometer_km !== null
            && $currentOdometerKm !== null
            && $currentOdometerKm >= $schedule->next_due_odometer_km;

        if (! $dateDue && ! $odometerDue) {
            return;
        }

        $reasons = [];
        if ($dateDue) {
            $reasons[] = 'due date reached';
        }
        if ($odometerDue) {
            $reasons[] = 'odometer threshold reached';
        }

        $this->createAlert(
            type: AlertType::MaintenanceDue,
            vehicleId: $schedule->vehicle_id,
            companyId: $schedule->company_id,
            message: sprintf('Maintenance schedule "%s" is due (%s).', $schedule->name, implode(' and ', $reasons)),
            context: [
                'maintenance_schedule_id' => $schedule->id,
                'next_due_date' => $schedule->next_due_date?->toDateString(),
                'next_due_odometer_km' => $schedule->next_due_odometer_km,
                'current_odometer_km' => $currentOdometerKm,
            ]
        );
    }

    public function resolveMaintenanceAlertsForSchedule(MaintenanceSchedule $schedule): void
    {
        $resolvedAny = false;

        Alert::query()
            ->where('company_id', $schedule->company_id)
            ->where('vehicle_id', $schedule->vehicle_id)
            ->where('type', AlertType::MaintenanceDue)
            ->whereNull('resolved_at')
            ->get()
            ->filter(fn (Alert $alert) => (int) data_get($alert->context, 'maintenance_schedule_id') === $schedule->id)
            ->each(function (Alert $alert) use (&$resolvedAny): void {
                $alert->forceFill(['resolved_at' => now()])->save();
                $resolvedAny = true;
            });

        if ($resolvedAny) {
            $this->fleetRealtimeNotifier->notifyAlertChanged(
                type: AlertType::MaintenanceDue,
                companyId: $schedule->company_id,
                vehicleId: $schedule->vehicle_id,
                reason: 'alert.resolved',
            );
        }
    }

    public function evaluateDriverLicense(Driver $driver): void
    {
        if (! $driver->is_active || $driver->trashed()) {
            $this->resolveDriverLicenseAlerts($driver);

            return;
        }

        $expiresAt = $driver->license_expires_at?->startOfDay();

        if (! $expiresAt) {
            $this->resolveDriverLicenseAlerts($driver);

            return;
        }

        if ($expiresAt->isFuture()) {
            $this->resolveDriverLicenseAlerts($driver);

            return;
        }

        $this->createAlert(
            type: AlertType::DriverLicenseExpired,
            vehicleId: null,
            companyId: $driver->company_id,
            message: sprintf('Driver "%s" has an expired license.', $driver->name),
            context: [
                'driver_id' => $driver->id,
                'driver_name' => $driver->name,
                'license_expires_at' => $driver->license_expires_at?->toDateString(),
            ]
        );
    }

    public function resolveDriverLicenseAlerts(Driver $driver): void
    {
        $updated = Alert::query()
            ->where('company_id', $driver->company_id)
            ->where('type', AlertType::DriverLicenseExpired)
            ->whereNull('resolved_at')
            ->where('context->driver_id', $driver->id)
            ->update(['resolved_at' => now()]);

        if ($updated > 0) {
            $this->fleetRealtimeNotifier->notifyAlertChanged(
                type: AlertType::DriverLicenseExpired,
                companyId: $driver->company_id,
                vehicleId: null,
                reason: 'alert.resolved',
            );
        }
    }

    private function resolveSpeedingAlertsIfRecovered(TelemetryEvent $event, float $speedThresholdKmh): void
    {
        $recentEvents = TelemetryEvent::query()
            ->where('company_id', $event->company_id)
            ->where('vehicle_id', $event->vehicle_id)
            ->where('occurred_at', '<=', $event->occurred_at)
            ->latest('occurred_at')
            ->latest('id')
            ->limit(3)
            ->get();

        if ($recentEvents->count() < 3) {
            return;
        }

        $hasRecovered = $recentEvents->every(
            fn (TelemetryEvent $telemetryEvent) => $telemetryEvent->speed_kmh <= $speedThresholdKmh
        );

        if (! $hasRecovered) {
            return;
        }

        $updated = Alert::query()
            ->where('company_id', $event->company_id)
            ->where('vehicle_id', $event->vehicle_id)
            ->where('type', AlertType::Speeding)
            ->whereNull('resolved_at')
            ->update(['resolved_at' => now()]);

        if ($updated > 0) {
            $this->fleetRealtimeNotifier->notifyAlertChanged(
                type: AlertType::Speeding,
                companyId: $event->company_id,
                vehicleId: $event->vehicle_id,
                reason: 'alert.resolved',
            );
        }
    }

    private function speedAlertThresholdKmh(int $companyId): float
    {
        $company = Company::query()->find($companyId);

        return $company?->speedAlertThresholdKmh() ?? (float) config('fleet.speed_alert_threshold_kmh', 90);
    }

    private function createAlert(AlertType $type, ?int $vehicleId, int $companyId, string $message, array $context): void
    {
        $lockKey = $this->alertLockKey($type, $companyId, $vehicleId, $context);

        Cache::lock($lockKey, 5)->block(5, function () use ($type, $vehicleId, $companyId, $message, $context): void {
            $query = Alert::query()
                ->where('company_id', $companyId)
                ->where('type', $type)
                ->whereNull('resolved_at');

            if ($vehicleId === null) {
                $query->whereNull('vehicle_id');
            } else {
                $query->where('vehicle_id', $vehicleId);
            }

            if ($type === AlertType::MaintenanceDue && isset($context['maintenance_schedule_id'])) {
                $query->where('context->maintenance_schedule_id', $context['maintenance_schedule_id']);
            } elseif ($type === AlertType::DriverLicenseExpired && isset($context['driver_id'])) {
                $query->where('context->driver_id', $context['driver_id']);
            } else {
                $query->where('created_at', '>=', now()->subMinutes(15));
            }

            if ($query->exists()) {
                return;
            }

            Alert::create([
                'company_id' => $companyId,
                'vehicle_id' => $vehicleId,
                'type' => $type,
                'message' => $message,
                'severity' => $this->severityForType($type),
                'triggered_at' => now(),
                'context' => $context,
            ]);

            $this->fleetRealtimeNotifier->notifyAlertChanged(
                type: $type,
                companyId: $companyId,
                vehicleId: $vehicleId,
                reason: 'alert.created',
            );
        });
    }

    private function alertLockKey(AlertType $type, int $companyId, ?int $vehicleId, array $context): string
    {
        $identity = match ($type) {
            AlertType::MaintenanceDue => 'schedule:'.(string) ($context['maintenance_schedule_id'] ?? 'none'),
            AlertType::DriverLicenseExpired => 'driver:'.(string) ($context['driver_id'] ?? 'none'),
            default => 'recent',
        };

        return sprintf(
            'alerts:create:%s:%d:%s:%s',
            $type->value,
            $companyId,
            $vehicleId ?? 'none',
            $identity,
        );
    }

    private function severityForType(AlertType $type): string
    {
        return match ($type) {
            AlertType::MaintenanceDue,
            AlertType::DriverLicenseExpired,
            AlertType::PossibleFuelTheft,
            AlertType::UnexpectedFuelDrop => 'high',
            AlertType::RefuelWithoutTrip,
            AlertType::Speeding,
            AlertType::ProlongedIdling,
            AlertType::OfflineVehicle,
            AlertType::AbnormalFuelConsumption => 'medium',
            default => 'low',
        };
    }
}
