<?php

use Carbon\CarbonImmutable;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql' || ! Schema::hasTable('telemetry_events')) {
            return;
        }

        if ($this->isAlreadyPartitioned()) {
            $this->ensureMonthlyPartitions(
                $this->partitionWindowStart(),
                $this->partitionWindowEnd(),
            );

            return;
        }

        [$windowStart, $windowEnd] = $this->partitionWindow();
        $columns = implode(', ', [
            'id',
            'company_id',
            'vehicle_id',
            'message_id',
            'ingestion_key',
            'occurred_at',
            'latitude',
            'longitude',
            'speed_kmh',
            'engine_on',
            'odometer_km',
            'fuel_level',
            'heading',
            'payload',
            'processing_started_at',
            'processed_at',
            'processing_error',
            'created_at',
            'updated_at',
        ]);

        DB::transaction(function () use ($windowStart, $windowEnd, $columns): void {
            DB::statement('ALTER TABLE telemetry_events RENAME TO telemetry_events_legacy');

            DB::unprepared(<<<'SQL'
                CREATE TABLE telemetry_events (
                    id BIGSERIAL NOT NULL,
                    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                    vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
                    message_id VARCHAR(120) NULL,
                    ingestion_key VARCHAR(64) NULL,
                    occurred_at TIMESTAMP NOT NULL,
                    latitude NUMERIC(10, 7) NOT NULL,
                    longitude NUMERIC(10, 7) NOT NULL,
                    speed_kmh NUMERIC(8, 2) NOT NULL DEFAULT 0,
                    engine_on BOOLEAN NOT NULL DEFAULT FALSE,
                    odometer_km NUMERIC(12, 2) NULL,
                    fuel_level NUMERIC(5, 2) NULL,
                    heading NUMERIC(8, 2) NULL,
                    payload JSON NULL,
                    processing_started_at TIMESTAMP NULL,
                    processed_at TIMESTAMP NULL,
                    processing_error TEXT NULL,
                    created_at TIMESTAMP NULL,
                    updated_at TIMESTAMP NULL
                ) PARTITION BY RANGE (occurred_at)
            SQL);

            $this->ensureMonthlyPartitions($windowStart, $windowEnd);

            DB::statement("INSERT INTO telemetry_events ({$columns}) SELECT {$columns} FROM telemetry_events_legacy ORDER BY occurred_at, id");
            DB::statement('DROP TABLE telemetry_events_legacy');

            DB::statement("SELECT setval(pg_get_serial_sequence('telemetry_events', 'id'), COALESCE((SELECT MAX(id) FROM telemetry_events), 1), true)");

            $this->createPartitionedIndexes();
        });
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql' || ! Schema::hasTable('telemetry_events') || ! $this->isAlreadyPartitioned()) {
            return;
        }

        $columns = implode(', ', [
            'id',
            'company_id',
            'vehicle_id',
            'message_id',
            'ingestion_key',
            'occurred_at',
            'latitude',
            'longitude',
            'speed_kmh',
            'engine_on',
            'odometer_km',
            'fuel_level',
            'heading',
            'payload',
            'processing_started_at',
            'processed_at',
            'processing_error',
            'created_at',
            'updated_at',
        ]);

        DB::transaction(function () use ($columns): void {
            DB::unprepared(<<<'SQL'
                CREATE TABLE telemetry_events_plain (
                    id BIGSERIAL PRIMARY KEY,
                    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                    vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
                    message_id VARCHAR(120) NULL,
                    ingestion_key VARCHAR(64) NULL,
                    occurred_at TIMESTAMP NOT NULL,
                    latitude NUMERIC(10, 7) NOT NULL,
                    longitude NUMERIC(10, 7) NOT NULL,
                    speed_kmh NUMERIC(8, 2) NOT NULL DEFAULT 0,
                    engine_on BOOLEAN NOT NULL DEFAULT FALSE,
                    odometer_km NUMERIC(12, 2) NULL,
                    fuel_level NUMERIC(5, 2) NULL,
                    heading NUMERIC(8, 2) NULL,
                    payload JSON NULL,
                    processing_started_at TIMESTAMP NULL,
                    processed_at TIMESTAMP NULL,
                    processing_error TEXT NULL,
                    created_at TIMESTAMP NULL,
                    updated_at TIMESTAMP NULL
                )
            SQL);

            DB::statement("INSERT INTO telemetry_events_plain ({$columns}) SELECT {$columns} FROM telemetry_events ORDER BY occurred_at, id");
            DB::statement('DROP TABLE telemetry_events CASCADE');
            DB::statement('ALTER TABLE telemetry_events_plain RENAME TO telemetry_events');
            DB::statement("SELECT setval(pg_get_serial_sequence('telemetry_events', 'id'), COALESCE((SELECT MAX(id) FROM telemetry_events), 1), true)");

            DB::statement('CREATE INDEX telemetry_events_occurred_at_index ON telemetry_events (occurred_at)');
            DB::statement('CREATE INDEX telemetry_events_company_vehicle_occurred_at_index ON telemetry_events (company_id, vehicle_id, occurred_at)');
            DB::statement('CREATE INDEX telemetry_events_vehicle_occurred_at_idx ON telemetry_events (vehicle_id, occurred_at)');
            DB::statement('CREATE UNIQUE INDEX telemetry_events_ingestion_key_unique ON telemetry_events (ingestion_key)');
            DB::statement('CREATE INDEX telemetry_events_company_vehicle_processed_occurred_idx ON telemetry_events (company_id, vehicle_id, processed_at, occurred_at)');
            DB::statement('CREATE INDEX telemetry_events_processed_occurred_idx ON telemetry_events (processed_at, occurred_at)');
        });
    }

    private function isAlreadyPartitioned(): bool
    {
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

    private function partitionWindow(): array
    {
        return [
            $this->partitionWindowStart(),
            $this->partitionWindowEnd(),
        ];
    }

    private function partitionWindowStart(): CarbonImmutable
    {
        $oldestEventAt = DB::table('telemetry_events')
            ->min('occurred_at');

        $oldestMonth = $oldestEventAt
            ? CarbonImmutable::parse((string) $oldestEventAt)->startOfMonth()
            : CarbonImmutable::now()->startOfMonth();
        $configuredStart = CarbonImmutable::now()
            ->startOfMonth()
            ->subMonths(max((int) config('fleet.telemetry_partition_months_back', 1), 0));

        return $oldestMonth->lte($configuredStart)
            ? $oldestMonth
            : $configuredStart;
    }

    private function partitionWindowEnd(): CarbonImmutable
    {
        $latestEventAt = DB::table('telemetry_events')
            ->max('occurred_at');

        $latestMonth = $latestEventAt
            ? CarbonImmutable::parse((string) $latestEventAt)->startOfMonth()
            : CarbonImmutable::now()->startOfMonth();
        $configuredEnd = CarbonImmutable::now()
            ->startOfMonth()
            ->addMonths(max((int) config('fleet.telemetry_partition_months_ahead', 3), 0));

        return $latestMonth->gte($configuredEnd)
            ? $latestMonth
            : $configuredEnd;
    }

    private function ensureMonthlyPartitions(CarbonImmutable $start, CarbonImmutable $end): void
    {
        $month = $start->startOfMonth();
        $endMonth = $end->startOfMonth();

        while ($month->lte($endMonth)) {
            $partitionName = sprintf('telemetry_events_y%sm%s', $month->format('Y'), $month->format('m'));
            $from = $month->toDateString();
            $to = $month->addMonth()->toDateString();

            DB::statement(sprintf(
                "CREATE TABLE IF NOT EXISTS %s PARTITION OF telemetry_events FOR VALUES FROM ('%s') TO ('%s')",
                $partitionName,
                $from,
                $to,
            ));

            $month = $month->addMonth();
        }
    }

    private function createPartitionedIndexes(): void
    {
        DB::statement('CREATE INDEX telemetry_events_id_idx ON telemetry_events (id)');
        DB::statement('CREATE INDEX telemetry_events_occurred_at_index ON telemetry_events (occurred_at)');
        DB::statement('CREATE INDEX telemetry_events_company_vehicle_occurred_at_index ON telemetry_events (company_id, vehicle_id, occurred_at)');
        DB::statement('CREATE INDEX telemetry_events_vehicle_occurred_at_idx ON telemetry_events (vehicle_id, occurred_at)');
        DB::statement('CREATE INDEX telemetry_events_ingestion_key_idx ON telemetry_events (ingestion_key)');
        DB::statement('CREATE INDEX telemetry_events_company_vehicle_processed_occurred_idx ON telemetry_events (company_id, vehicle_id, processed_at, occurred_at)');
        DB::statement('CREATE INDEX telemetry_events_processed_occurred_idx ON telemetry_events (processed_at, occurred_at)');
    }
};
