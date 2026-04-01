<?php

namespace App\Console\Commands;

use App\Domain\Alerts\Services\AlertEvaluationService;
use App\Domain\Telemetry\Models\VehicleState;
use Illuminate\Console\Command;

class CheckOfflineVehiclesCommand extends Command
{
    protected $signature = 'app:check-offline-vehicles';

    protected $description = 'Mark stale vehicles offline and raise alerts.';

    public function handle(AlertEvaluationService $service): int
    {
        VehicleState::query()
            ->where('last_event_at', '<', now()->subMinutes((int) config('fleet.offline_threshold_minutes', 10)))
            ->each(fn (VehicleState $state) => $service->markOffline($state));

        $this->info('Offline check complete.');

        return self::SUCCESS;
    }
}
