<?php

namespace App\Domain\Platform\Services;

use App\Domain\Platform\Models\PlatformJobStatus;
use App\Domain\Platform\Support\PlatformJobCatalog;
use Throwable;

class PlatformJobStatusService
{
    public function markStarted(string $jobKey): void
    {
        $definition = PlatformJobCatalog::definitions()[$jobKey] ?? [
            'label' => $jobKey,
            'frequency' => 'Manual',
            'expected_interval_minutes' => 0,
        ];

        PlatformJobStatus::query()->updateOrCreate(
            ['job_key' => $jobKey],
            [
                'label' => $definition['label'],
                'frequency' => $definition['frequency'],
                'expected_interval_minutes' => $definition['expected_interval_minutes'],
                'status' => 'pending',
                'last_started_at' => now(),
                'last_error' => null,
            ],
        );
    }

    public function markSucceeded(string $jobKey, int $runtimeMs): void
    {
        $now = now();

        PlatformJobStatus::query()->where('job_key', $jobKey)->update([
            'status' => 'success',
            'last_finished_at' => $now,
            'last_succeeded_at' => $now,
            'last_error' => null,
            'last_runtime_ms' => $runtimeMs,
        ]);
    }

    public function markFailed(string $jobKey, Throwable $exception, int $runtimeMs): void
    {
        $now = now();

        PlatformJobStatus::query()->where('job_key', $jobKey)->update([
            'status' => 'failed',
            'last_finished_at' => $now,
            'last_failed_at' => $now,
            'last_error' => $exception->getMessage(),
            'last_runtime_ms' => $runtimeMs,
        ]);
    }

    /**
     * @param  callable(): int  $callback
     */
    public function runMonitored(string $jobKey, callable $callback): int
    {
        $this->markStarted($jobKey);
        $startedAt = microtime(true);

        try {
            $result = $callback();
            $this->markSucceeded($jobKey, (int) round((microtime(true) - $startedAt) * 1000));

            return $result;
        } catch (Throwable $exception) {
            $this->markFailed($jobKey, $exception, (int) round((microtime(true) - $startedAt) * 1000));

            throw $exception;
        }
    }
}
