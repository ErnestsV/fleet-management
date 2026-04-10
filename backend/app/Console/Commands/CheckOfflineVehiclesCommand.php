<?php

namespace App\Console\Commands;

use App\Domain\Alerts\Services\AlertEvaluationService;
use App\Domain\Platform\Services\PlatformJobStatusService;
use App\Domain\Telemetry\Models\VehicleState;
use Illuminate\Console\Command;

class CheckOfflineVehiclesCommand extends Command
{
    protected $signature = 'app:check-offline-vehicles';

    protected $description = 'Mark stale vehicles offline and raise alerts.';

    public function handle(AlertEvaluationService $service, PlatformJobStatusService $statusService): int
    {
        return $statusService->runMonitored('check-offline-vehicles', function () use ($service): int {
            VehicleState::query()
                ->where('last_event_at', '<', now()->subMinutes((int) config('fleet.offline_threshold_minutes', 10)))
                ->chunkById(200, function ($states) use ($service): void {
                    $states->each(fn (VehicleState $state) => $service->markOffline($state));
                });

            $this->info('Offline check complete.');

            return self::SUCCESS;
        });
    }
}
