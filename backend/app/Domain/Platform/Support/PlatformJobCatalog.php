<?php

namespace App\Domain\Platform\Support;

class PlatformJobCatalog
{
    /**
     * @return array<string, array{label: string, frequency: string, expected_interval_minutes: int}>
     */
    public static function definitions(): array
    {
        return [
            'scheduler-heartbeat' => [
                'label' => 'Scheduler heartbeat',
                'frequency' => 'Every minute',
                'expected_interval_minutes' => 1,
            ],
            'check-offline-vehicles' => [
                'label' => 'Offline vehicle checks',
                'frequency' => 'Every 5 minutes',
                'expected_interval_minutes' => 5,
            ],
            'check-maintenance-schedules' => [
                'label' => 'Maintenance schedule checks',
                'frequency' => 'Every 5 minutes',
                'expected_interval_minutes' => 5,
            ],
            'check-driver-licenses' => [
                'label' => 'Driver license checks',
                'frequency' => 'Daily',
                'expected_interval_minutes' => 1440,
            ],
            'ensure-telemetry-partitions' => [
                'label' => 'Telemetry partition checks',
                'frequency' => 'Daily',
                'expected_interval_minutes' => 1440,
            ],
        ];
    }
}
