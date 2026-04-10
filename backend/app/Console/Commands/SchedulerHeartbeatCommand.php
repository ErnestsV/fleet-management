<?php

namespace App\Console\Commands;

use App\Domain\Platform\Services\PlatformJobStatusService;
use Illuminate\Console\Command;

class SchedulerHeartbeatCommand extends Command
{
    protected $signature = 'app:heartbeat-scheduler';

    protected $description = 'Record scheduler heartbeat for platform operations visibility.';

    public function handle(PlatformJobStatusService $service): int
    {
        return $service->runMonitored('scheduler-heartbeat', function (): int {
            $this->info('Scheduler heartbeat recorded.');

            return self::SUCCESS;
        });
    }
}
