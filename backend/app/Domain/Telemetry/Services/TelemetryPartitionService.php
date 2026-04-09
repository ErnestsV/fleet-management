<?php

namespace App\Domain\Telemetry\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class TelemetryPartitionService
{
    public function ensureMonthlyPartitions(?CarbonImmutable $anchor = null, ?int $monthsBack = null, ?int $monthsAhead = null): int
    {
        if (! $this->supportsPartitionManagement()) {
            return 0;
        }

        $anchor ??= CarbonImmutable::now()->startOfMonth();
        $monthsBack = max($monthsBack ?? (int) config('fleet.telemetry_partition_months_back', 1), 0);
        $monthsAhead = max($monthsAhead ?? (int) config('fleet.telemetry_partition_months_ahead', 3), 0);

        $created = 0;

        for ($offset = -$monthsBack; $offset <= $monthsAhead; $offset++) {
            $monthStart = $anchor->addMonths($offset)->startOfMonth();

            if ($this->partitionExists($monthStart)) {
                continue;
            }

            $this->createPartition($monthStart);
            $created++;
        }

        return $created;
    }

    public function supportsPartitionManagement(): bool
    {
        if (DB::getDriverName() !== 'pgsql' || ! Schema::hasTable('telemetry_events')) {
            return false;
        }

        return (bool) DB::scalar(<<<'SQL'
            SELECT EXISTS (
                SELECT 1
                FROM pg_partitioned_table partitioned
                INNER JOIN pg_class relation
                    ON relation.oid = partitioned.partrelid
                INNER JOIN pg_namespace namespace
                    ON namespace.oid = relation.relnamespace
                WHERE relation.relname = 'telemetry_events'
                  AND namespace.nspname = current_schema()
            )
        SQL);
    }

    private function partitionExists(CarbonImmutable $monthStart): bool
    {
        return Schema::hasTable($this->partitionName($monthStart));
    }

    private function createPartition(CarbonImmutable $monthStart): void
    {
        $partitionName = $this->partitionName($monthStart);
        $from = $monthStart->toDateString();
        $to = $monthStart->addMonth()->toDateString();

        DB::statement(sprintf(
            "CREATE TABLE IF NOT EXISTS %s PARTITION OF telemetry_events FOR VALUES FROM ('%s') TO ('%s')",
            $partitionName,
            $from,
            $to,
        ));
    }

    private function partitionName(CarbonImmutable $monthStart): string
    {
        return sprintf('telemetry_events_y%sm%s', $monthStart->format('Y'), $monthStart->format('m'));
    }
}
