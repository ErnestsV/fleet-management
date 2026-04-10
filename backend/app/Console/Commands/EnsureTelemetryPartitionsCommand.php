<?php

namespace App\Console\Commands;

use App\Domain\Platform\Services\PlatformJobStatusService;
use App\Domain\Telemetry\Services\TelemetryPartitionService;
use Illuminate\Console\Command;

class EnsureTelemetryPartitionsCommand extends Command
{
    protected $signature = 'app:ensure-telemetry-partitions';

    protected $description = 'Ensure monthly PostgreSQL partitions exist for telemetry_events.';

    public function handle(TelemetryPartitionService $service, PlatformJobStatusService $statusService): int
    {
        return $statusService->runMonitored('ensure-telemetry-partitions', function () use ($service): int {
            $created = $service->ensureMonthlyPartitions();

            $this->info("Telemetry partition check complete. Created {$created} partition(s).");

            return self::SUCCESS;
        });
    }
}
