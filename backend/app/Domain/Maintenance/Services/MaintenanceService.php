<?php

namespace App\Domain\Maintenance\Services;

use App\Domain\Alerts\Services\AlertEvaluationService;
use App\Domain\Maintenance\Models\MaintenanceRecord;
use App\Domain\Maintenance\Models\MaintenanceSchedule;

class MaintenanceService
{
    public function __construct(
        private readonly AlertEvaluationService $alertEvaluationService,
    ) {
    }

    public function createSchedule(array $data): MaintenanceSchedule
    {
        return MaintenanceSchedule::create($data);
    }

    public function updateSchedule(MaintenanceSchedule $schedule, array $data): MaintenanceSchedule
    {
        $schedule->update($data);

        return $schedule->refresh();
    }

    public function createRecord(array $data): MaintenanceRecord
    {
        $record = MaintenanceRecord::create($data);

        if ($record->maintenance_schedule_id) {
            $schedule = MaintenanceSchedule::find($record->maintenance_schedule_id);

            if ($schedule) {
                $schedule->update([
                    'next_due_date' => $schedule->interval_days ? $record->service_date->copy()->addDays($schedule->interval_days) : $schedule->next_due_date,
                    'next_due_odometer_km' => $schedule->interval_km && $record->odometer_km
                        ? $record->odometer_km + $schedule->interval_km
                        : $schedule->next_due_odometer_km,
                ]);

                $this->alertEvaluationService->resolveMaintenanceAlertsForSchedule($schedule->refresh());
            }
        }

        return $record;
    }

    public function updateRecord(MaintenanceRecord $record, array $data): MaintenanceRecord
    {
        $record->update($data);

        return $record->refresh();
    }
}
