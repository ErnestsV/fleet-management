<?php

namespace App\Domain\Maintenance\Services;

use App\Domain\Alerts\Services\AlertEvaluationService;
use App\Domain\Maintenance\Models\MaintenanceRecord;
use App\Domain\Maintenance\Models\MaintenanceSchedule;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

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
        return DB::transaction(function () use ($data): MaintenanceRecord {
            $record = MaintenanceRecord::create($data);

            if ($record->maintenance_schedule_id) {
                $schedule = MaintenanceSchedule::query()
                    ->lockForUpdate()
                    ->find($record->maintenance_schedule_id);

                if ($schedule) {
                    $calculatedNextDueDate = $schedule->interval_days
                        ? $record->service_date->copy()->addDays($schedule->interval_days)
                        : null;
                    $calculatedNextDueOdometer = $schedule->interval_km !== null && $record->odometer_km !== null
                        ? $record->odometer_km + $schedule->interval_km
                        : null;

                    $schedule->update([
                        'next_due_date' => $this->maxDate($schedule->next_due_date, $calculatedNextDueDate),
                        'next_due_odometer_km' => $calculatedNextDueOdometer !== null
                            ? max((float) ($schedule->next_due_odometer_km ?? $calculatedNextDueOdometer), $calculatedNextDueOdometer)
                            : $schedule->next_due_odometer_km,
                    ]);

                    $this->alertEvaluationService->resolveMaintenanceAlertsForSchedule($schedule->refresh());
                }
            }

            return $record;
        });
    }

    public function updateRecord(MaintenanceRecord $record, array $data): MaintenanceRecord
    {
        $record->update($data);

        return $record->refresh();
    }

    private function maxDate(?Carbon $current, ?Carbon $next): ?Carbon
    {
        if ($current === null) {
            return $next;
        }

        if ($next === null) {
            return $current;
        }

        return $next->greaterThan($current) ? $next : $current;
    }
}
