<?php

namespace App\Console\Commands;

use App\Domain\Alerts\Services\AlertEvaluationService;
use App\Domain\Maintenance\Models\MaintenanceSchedule;
use Illuminate\Console\Command;

class CheckMaintenanceSchedulesCommand extends Command
{
    protected $signature = 'app:check-maintenance-schedules';

    protected $description = 'Raise alerts for maintenance schedules that are due by date.';

    public function handle(AlertEvaluationService $service): int
    {
        MaintenanceSchedule::query()
            ->where('is_active', true)
            ->whereNotNull('next_due_date')
            ->whereDate('next_due_date', '<=', today())
            ->with('vehicle.state')
            ->chunkById(200, function ($schedules) use ($service): void {
                $schedules->each(function (MaintenanceSchedule $schedule) use ($service): void {
                    $service->evaluateMaintenanceSchedule($schedule, $schedule->vehicle?->state?->odometer_km);
                });
            });

        $this->info('Maintenance schedule check complete.');

        return self::SUCCESS;
    }
}
