<?php

namespace App\Domain\Telemetry\Services;

use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Telemetry\Models\TelemetryEvent;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class TelemetryHealthService
{
    public function paginated(User $user, array $filters = []): array
    {
        $now = now();
        $summary = $this->buildSummary($this->baseQuery($user, $now), $now);
        $perPage = min(max((int) ($filters['per_page'] ?? 10), 1), 100);

        $paginator = $this->applyFilters($this->baseQuery($user, $now), $filters, $now)
            ->orderByRaw($this->healthSortExpression(), $this->healthSortBindings($now))
            ->orderBy('states.last_event_at')
            ->orderBy('vehicles.plate_number')
            ->paginate($perPage);

        $paginator->setCollection(
            $paginator->getCollection()->map(fn ($row) => $this->mapRow($row, $now))
        );

        return [
            'summary' => $summary,
            'paginator' => $paginator,
        ];
    }

    public function summary(User $user): array
    {
        $now = now();

        return $this->buildSummary($this->baseQuery($user, $now), $now);
    }

    private function baseQuery(User $user, Carbon $now): Builder
    {
        $recentEventCountQuery = TelemetryEvent::query()
            ->selectRaw('vehicle_id')
            ->selectRaw('COUNT(*) as events_last_24h')
            ->where('occurred_at', '>=', $now->copy()->subDay())
            ->groupBy('vehicle_id');

        return Vehicle::query()
            ->toBase()
            ->leftJoin('vehicle_states as states', 'states.vehicle_id', '=', 'vehicles.id')
            ->leftJoinSub($recentEventCountQuery->toBase(), 'recent_events', fn ($join) => $join->on('recent_events.vehicle_id', '=', 'vehicles.id'))
            ->whereNull('vehicles.deleted_at')
            ->where('vehicles.is_active', true)
            ->when(
                ! $user->isSuperAdmin(),
                fn ($query) => $user->company_id === null
                    ? $query->whereRaw('1 = 0')
                    : $query->where('vehicles.company_id', $user->company_id)
            )
            ->select([
                'vehicles.id as vehicle_id',
                'vehicles.name',
                'vehicles.plate_number',
                'vehicles.make',
                'vehicles.model',
                'vehicles.device_identifier',
                'states.status',
                'states.last_event_at',
                'states.latitude',
                'states.longitude',
                'states.odometer_km',
                'states.fuel_level',
                DB::raw('COALESCE(recent_events.events_last_24h, 0) as events_last_24h'),
            ]);
    }

    private function buildSummary(Builder $query, Carbon $now): array
    {
        $freshCutoff = $now->copy()->subMinutes($this->freshMinutes());
        $staleCutoff = $now->copy()->subMinutes($this->staleMinutes());
        $offlineCutoff = $now->copy()->subHours($this->offlineHours());
        $lowFrequencyMinimum = $this->lowFrequencyEvents24h();

        $aggregate = DB::query()
            ->fromSub(clone $query, 'telemetry_health_rows')
            ->selectRaw('COUNT(*) as total_devices')
            ->selectRaw('SUM(CASE WHEN last_event_at IS NOT NULL AND last_event_at >= ? THEN 1 ELSE 0 END) as fresh_count', [$freshCutoff])
            ->selectRaw('SUM(CASE WHEN last_event_at IS NOT NULL AND last_event_at < ? AND last_event_at >= ? THEN 1 ELSE 0 END) as delayed_count', [$freshCutoff, $staleCutoff])
            ->selectRaw('SUM(CASE WHEN last_event_at IS NOT NULL AND last_event_at < ? AND last_event_at >= ? THEN 1 ELSE 0 END) as stale_count', [$staleCutoff, $offlineCutoff])
            ->selectRaw('SUM(CASE WHEN last_event_at IS NOT NULL AND last_event_at < ? THEN 1 ELSE 0 END) as offline_over_24h_count', [$offlineCutoff])
            ->selectRaw('SUM(CASE WHEN last_event_at IS NULL THEN 1 ELSE 0 END) as no_data_count')
            ->selectRaw("SUM(CASE WHEN last_event_at IS NOT NULL AND ({$this->missingFieldsSubqueryExpression()}) THEN 1 ELSE 0 END) as missing_fields_count")
            ->selectRaw("SUM(CASE WHEN last_event_at IS NOT NULL AND last_event_at >= ? AND NOT ({$this->missingFieldsSubqueryExpression()}) AND COALESCE(events_last_24h, 0) < ? THEN 1 ELSE 0 END) as low_frequency_count", [$staleCutoff, $lowFrequencyMinimum])
            ->selectRaw("SUM(CASE WHEN last_event_at IS NOT NULL AND last_event_at >= ? AND NOT ({$this->missingFieldsSubqueryExpression()}) AND COALESCE(events_last_24h, 0) >= ? THEN 1 ELSE 0 END) as healthy_count", [$staleCutoff, $lowFrequencyMinimum])
            ->first();

        $totalDevices = max((int) ($aggregate->total_devices ?? 0), 1);

        return [
            'total_devices' => (int) ($aggregate->total_devices ?? 0),
            'freshness_rate_pct' => round(((int) ($aggregate->fresh_count ?? 0) / $totalDevices) * 100, 1),
            'healthy_count' => (int) ($aggregate->healthy_count ?? 0),
            'stale_count' => (int) ($aggregate->stale_count ?? 0),
            'offline_over_24h_count' => (int) ($aggregate->offline_over_24h_count ?? 0),
            'no_data_count' => (int) ($aggregate->no_data_count ?? 0),
            'low_frequency_count' => (int) ($aggregate->low_frequency_count ?? 0),
            'missing_fields_count' => (int) ($aggregate->missing_fields_count ?? 0),
            'freshness_buckets' => [
                ['key' => 'fresh', 'label' => '0-'.$this->freshMinutes().'m', 'count' => (int) ($aggregate->fresh_count ?? 0)],
                ['key' => 'delayed', 'label' => $this->freshMinutes().'-'.$this->staleMinutes().'m', 'count' => (int) ($aggregate->delayed_count ?? 0)],
                ['key' => 'stale', 'label' => $this->staleMinutes().'m-'.$this->offlineHours().'h', 'count' => (int) ($aggregate->stale_count ?? 0)],
                ['key' => 'offline', 'label' => '>'.$this->offlineHours().'h', 'count' => (int) ($aggregate->offline_over_24h_count ?? 0)],
                ['key' => 'no_data', 'label' => 'No data', 'count' => (int) ($aggregate->no_data_count ?? 0)],
            ],
            'thresholds' => [
                'fresh_minutes' => $this->freshMinutes(),
                'stale_minutes' => $this->staleMinutes(),
                'offline_hours' => $this->offlineHours(),
                'low_frequency_events_24h' => $lowFrequencyMinimum,
            ],
        ];
    }

    private function applyFilters(Builder $query, array $filters, Carbon $now): Builder
    {
        $search = trim((string) ($filters['search'] ?? ''));
        $healthStatus = $filters['health_status'] ?? null;
        $freshnessBucket = $filters['freshness_bucket'] ?? null;

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder->where('vehicles.name', 'like', "%{$search}%")
                    ->orWhere('vehicles.plate_number', 'like', "%{$search}%")
                    ->orWhere('vehicles.make', 'like', "%{$search}%")
                    ->orWhere('vehicles.model', 'like', "%{$search}%")
                    ->orWhere('vehicles.device_identifier', 'like', "%{$search}%");
            });
        }

        if (is_string($healthStatus) && $healthStatus !== '') {
            $this->applyHealthStatusFilter($query, $healthStatus, $now);
        }

        if (is_string($freshnessBucket) && $freshnessBucket !== '') {
            $this->applyFreshnessBucketFilter($query, $freshnessBucket, $now);
        }

        return $query;
    }

    private function applyHealthStatusFilter(Builder $query, string $healthStatus, Carbon $now): void
    {
        $staleCutoff = $now->copy()->subMinutes($this->staleMinutes());
        $offlineCutoff = $now->copy()->subHours($this->offlineHours());
        $lowFrequencyMinimum = $this->lowFrequencyEvents24h();

        match ($healthStatus) {
            'healthy' => $query
                ->whereNotNull('states.last_event_at')
                ->where('states.last_event_at', '>=', $staleCutoff)
                ->whereRaw('NOT ('.$this->missingFieldsExpression().')')
                ->whereRaw('COALESCE(recent_events.events_last_24h, 0) >= ?', [$lowFrequencyMinimum]),
            'missing_fields' => $query
                ->whereNotNull('states.last_event_at')
                ->whereRaw($this->missingFieldsExpression()),
            'low_frequency' => $query
                ->whereNotNull('states.last_event_at')
                ->where('states.last_event_at', '>=', $staleCutoff)
                ->whereRaw('NOT ('.$this->missingFieldsExpression().')')
                ->whereRaw('COALESCE(recent_events.events_last_24h, 0) < ?', [$lowFrequencyMinimum]),
            'stale' => $query
                ->whereNotNull('states.last_event_at')
                ->where('states.last_event_at', '<', $staleCutoff)
                ->where('states.last_event_at', '>=', $offlineCutoff),
            'offline' => $query
                ->whereNotNull('states.last_event_at')
                ->where('states.last_event_at', '<', $offlineCutoff),
            'no_data' => $query->whereNull('states.last_event_at'),
            default => null,
        };
    }

    private function applyFreshnessBucketFilter(Builder $query, string $freshnessBucket, Carbon $now): void
    {
        $freshCutoff = $now->copy()->subMinutes($this->freshMinutes());
        $staleCutoff = $now->copy()->subMinutes($this->staleMinutes());
        $offlineCutoff = $now->copy()->subHours($this->offlineHours());

        match ($freshnessBucket) {
            'fresh' => $query
                ->whereNotNull('states.last_event_at')
                ->where('states.last_event_at', '>=', $freshCutoff),
            'delayed' => $query
                ->whereNotNull('states.last_event_at')
                ->where('states.last_event_at', '<', $freshCutoff)
                ->where('states.last_event_at', '>=', $staleCutoff),
            'stale' => $query
                ->whereNotNull('states.last_event_at')
                ->where('states.last_event_at', '<', $staleCutoff)
                ->where('states.last_event_at', '>=', $offlineCutoff),
            'offline' => $query
                ->whereNotNull('states.last_event_at')
                ->where('states.last_event_at', '<', $offlineCutoff),
            'no_data' => $query->whereNull('states.last_event_at'),
            default => null,
        };
    }

    private function mapRow(object $row, Carbon $now): array
    {
        $lastEventAt = $row->last_event_at ? Carbon::parse($row->last_event_at) : null;
        $missingFields = [];

        if ($row->latitude === null || $row->longitude === null) {
            $missingFields[] = 'location';
        }

        if ($row->odometer_km === null) {
            $missingFields[] = 'odometer';
        }

        if ($row->fuel_level === null) {
            $missingFields[] = 'fuel';
        }

        return [
            'vehicle_id' => (int) $row->vehicle_id,
            'name' => $row->name,
            'plate_number' => $row->plate_number,
            'make' => $row->make,
            'model' => $row->model,
            'device_identifier' => $row->device_identifier,
            'status' => $row->status,
            'last_event_at' => $lastEventAt?->toIso8601String(),
            'minutes_since_last_event' => $lastEventAt?->diffInMinutes($now),
            'freshness_bucket' => $this->freshnessBucket($lastEventAt, $now),
            'health_status' => $this->healthStatus($lastEventAt, (int) $row->events_last_24h, $missingFields, $now),
            'events_last_24h' => (int) $row->events_last_24h,
            'missing_fields' => $missingFields,
        ];
    }

    private function freshnessBucket(?Carbon $lastEventAt, Carbon $now): string
    {
        if ($lastEventAt === null) {
            return 'no_data';
        }

        if ($lastEventAt->lt($now->copy()->subHours($this->offlineHours()))) {
            return 'offline';
        }

        if ($lastEventAt->lt($now->copy()->subMinutes($this->staleMinutes()))) {
            return 'stale';
        }

        if ($lastEventAt->lt($now->copy()->subMinutes($this->freshMinutes()))) {
            return 'delayed';
        }

        return 'fresh';
    }

    private function healthStatus(?Carbon $lastEventAt, int $eventsLast24h, array $missingFields, Carbon $now): string
    {
        if ($lastEventAt === null) {
            return 'no_data';
        }

        if ($lastEventAt->lt($now->copy()->subHours($this->offlineHours()))) {
            return 'offline';
        }

        if ($lastEventAt->lt($now->copy()->subMinutes($this->staleMinutes()))) {
            return 'stale';
        }

        if ($missingFields !== []) {
            return 'missing_fields';
        }

        if ($eventsLast24h < $this->lowFrequencyEvents24h()) {
            return 'low_frequency';
        }

        return 'healthy';
    }

    private function missingFieldsExpression(): string
    {
        return 'states.latitude IS NULL OR states.longitude IS NULL OR states.odometer_km IS NULL OR states.fuel_level IS NULL';
    }

    private function missingFieldsSubqueryExpression(): string
    {
        return 'latitude IS NULL OR longitude IS NULL OR odometer_km IS NULL OR fuel_level IS NULL';
    }

    private function healthSortExpression(): string
    {
        return "CASE
            WHEN states.last_event_at IS NULL THEN 0
            WHEN states.last_event_at < ? THEN 1
            WHEN states.last_event_at < ? THEN 2
            WHEN {$this->missingFieldsExpression()} THEN 3
            WHEN COALESCE(recent_events.events_last_24h, 0) < ? THEN 4
            ELSE 5
        END";
    }

    private function healthSortBindings(Carbon $now): array
    {
        return [
            $now->copy()->subHours($this->offlineHours()),
            $now->copy()->subMinutes($this->staleMinutes()),
            $this->lowFrequencyEvents24h(),
        ];
    }

    private function freshMinutes(): int
    {
        return max((int) config('fleet.telemetry_fresh_minutes', 15), 1);
    }

    private function staleMinutes(): int
    {
        return max((int) config('fleet.telemetry_stale_minutes', 60), $this->freshMinutes() + 1);
    }

    private function offlineHours(): int
    {
        return max((int) config('fleet.telemetry_offline_hours', 24), 1);
    }

    private function lowFrequencyEvents24h(): int
    {
        return max((int) config('fleet.telemetry_low_frequency_events_24h', 12), 1);
    }
}
