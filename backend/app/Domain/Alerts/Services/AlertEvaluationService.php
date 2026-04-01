<?php

namespace App\Domain\Alerts\Services;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Alerts\Models\Alert;
use App\Domain\Maintenance\Models\MaintenanceSchedule;
use App\Domain\Telemetry\Enums\VehicleStatus;
use App\Domain\Telemetry\Models\TelemetryEvent;
use App\Domain\Telemetry\Models\VehicleState;
use Illuminate\Support\Carbon;

class AlertEvaluationService
{
    public function evaluateTelemetry(TelemetryEvent $event, VehicleState $state): void
    {
        if ($event->speed_kmh > 90) {
            $this->createAlert(
                type: AlertType::Speeding,
                vehicleId: $event->vehicle_id,
                companyId: $event->company_id,
                message: 'Vehicle exceeded the configured speed threshold.',
                context: ['speed_kmh' => $event->speed_kmh]
            );
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
            ->with('vehicle')
            ->each(fn (MaintenanceSchedule $schedule) => $this->evaluateMaintenanceSchedule($schedule, $event->odometer_km));
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
        Alert::query()
            ->where('company_id', $schedule->company_id)
            ->where('vehicle_id', $schedule->vehicle_id)
            ->where('type', AlertType::MaintenanceDue)
            ->whereNull('resolved_at')
            ->get()
            ->filter(fn (Alert $alert) => (int) data_get($alert->context, 'maintenance_schedule_id') === $schedule->id)
            ->each(function (Alert $alert): void {
                $alert->forceFill(['resolved_at' => now()])->save();
            });
    }

    private function createAlert(AlertType $type, int $vehicleId, int $companyId, string $message, array $context): void
    {
        $query = Alert::query()
            ->where('company_id', $companyId)
            ->where('vehicle_id', $vehicleId)
            ->where('type', $type)
            ->whereNull('resolved_at');

        if ($type === AlertType::MaintenanceDue && isset($context['maintenance_schedule_id'])) {
            $query->where('context->maintenance_schedule_id', $context['maintenance_schedule_id']);
        } else {
            $query->where('created_at', '>=', now()->subMinutes(15));
        }

        $query->exists() || Alert::create([
                'company_id' => $companyId,
                'vehicle_id' => $vehicleId,
                'type' => $type,
                'message' => $message,
                'severity' => $type === AlertType::MaintenanceDue ? 'high' : 'medium',
                'triggered_at' => now(),
                'context' => $context,
            ]);
    }
}
