<?php

namespace App\Domain\Geofences\Services;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Alerts\Models\Alert;
use App\Domain\Geofences\Models\Geofence;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Pagination\LengthAwarePaginator as Paginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class GeofenceAnalyticsService
{
    public function paginated(User $user, array $filters = []): array
    {
        $rows = $this->analyticsRows($user, $filters);
        $perPage = min(max((int) ($filters['per_page'] ?? 10), 1), 100);
        $page = max((int) ($filters['page'] ?? 1), 1);
        $lastPage = max((int) ceil(max($rows->count(), 1) / $perPage), 1);
        $currentPage = min($page, $lastPage);

        /** @var LengthAwarePaginator $paginator */
        $paginator = new Paginator(
            items: $rows->forPage($currentPage, $perPage)->values(),
            total: $rows->count(),
            perPage: $perPage,
            currentPage: $currentPage,
            options: ['path' => url('/api/v1/geofence-analytics')],
        );

        return [
            'summary' => $this->buildSummary($rows),
            'paginator' => $paginator,
        ];
    }

    public function dashboardSummary(User $user): array
    {
        $rows = $this->analyticsRows($user);
        $summary = $this->buildSummary($rows);

        return [
            'window' => $summary['window'],
            'summary' => $summary['summary'],
            'top_visited_locations' => array_slice($summary['top_visited_locations'], 0, 3),
            'longest_dwell_locations' => array_slice($summary['longest_dwell_locations'], 0, 3),
        ];
    }

    private function analyticsRows(User $user, array $filters = []): Collection
    {
        $windowDays = max((int) config('fleet.geofence_analytics_window_days', 7), 1);
        $windowStart = now()->subDays($windowDays);
        $search = trim((string) ($filters['search'] ?? ''));

        $geofences = $this->baseGeofenceQuery($user)
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->whereRaw('LOWER(name) LIKE ?', ['%'.strtolower($this->escapeLike($search)).'%']);
            })
            ->orderBy('name')
            ->get(['id', 'name', 'is_active']);

        if ($geofences->isEmpty()) {
            return collect();
        }

        $geofenceIds = $geofences->pluck('id')->map(fn ($id) => (int) $id)->all();
        $windowedStats = $this->windowedStatsByGeofence($user, $windowStart, $geofenceIds);
        $activeVisitCounts = $this->activeVisitCounts($user, $geofenceIds);

        return $geofences
            ->map(function (Geofence $geofence) use ($windowedStats, $activeVisitCounts) {
                $stat = $windowedStats[$geofence->id] ?? null;
                $totalDwellMinutes = round((float) ($stat?->total_dwell_minutes ?? 0), 1);
                $resolvedVisitCount = (int) ($stat?->dwell_sample_count ?? 0);
                $averageDwellMinutes = $resolvedVisitCount > 0
                    ? round($totalDwellMinutes / $resolvedVisitCount, 1)
                    : null;
                $latestEntryAt = $this->isoTimestamp($stat?->latest_entry_at);
                $latestExitAt = $this->isoTimestamp($stat?->latest_exit_at);
                $lastActivityAt = collect([$latestEntryAt, $latestExitAt])
                    ->filter()
                    ->sortDesc()
                    ->first();

                return [
                    'geofence_id' => $geofence->id,
                    'name' => $geofence->name,
                    'is_active' => (bool) $geofence->is_active,
                    'entry_count' => (int) ($stat?->entry_count ?? 0),
                    'exit_count' => (int) ($stat?->exit_count ?? 0),
                    'unique_vehicle_count' => (int) ($stat?->unique_vehicle_count ?? 0),
                    'active_visit_count' => (int) ($activeVisitCounts[$geofence->id] ?? 0),
                    'resolved_visit_count' => $resolvedVisitCount,
                    'total_dwell_minutes' => $totalDwellMinutes,
                    'average_dwell_minutes' => $averageDwellMinutes,
                    'latest_entry_at' => $latestEntryAt,
                    'latest_exit_at' => $latestExitAt,
                    'last_activity_at' => $lastActivityAt,
                ];
            })
            ->sort(function (array $left, array $right) {
                $byEntries = $right['entry_count'] <=> $left['entry_count'];

                if ($byEntries !== 0) {
                    return $byEntries;
                }

                $leftLastActivity = $left['last_activity_at'] ? Carbon::parse($left['last_activity_at'])->getTimestamp() : 0;
                $rightLastActivity = $right['last_activity_at'] ? Carbon::parse($right['last_activity_at'])->getTimestamp() : 0;
                $byLastActivity = $rightLastActivity <=> $leftLastActivity;

                if ($byLastActivity !== 0) {
                    return $byLastActivity;
                }

                return strcasecmp($left['name'], $right['name']);
            })
            ->values();
    }

    private function buildSummary(Collection $rows): array
    {
        $windowDays = max((int) config('fleet.geofence_analytics_window_days', 7), 1);
        $windowStart = now()->subDays($windowDays);
        $resolvedVisitCount = (int) $rows->sum('resolved_visit_count');
        $averageDwellMinutes = $resolvedVisitCount > 0
            ? round((float) $rows->sum('total_dwell_minutes') / $resolvedVisitCount, 1)
            : null;

        return [
            'window' => [
                'days' => $windowDays,
                'start' => $windowStart->toIso8601String(),
                'end' => now()->toIso8601String(),
            ],
            'summary' => [
                'active_geofences' => (int) $rows->where('is_active', true)->count(),
                'total_entries' => (int) $rows->sum('entry_count'),
                'total_exits' => (int) $rows->sum('exit_count'),
                'active_visits' => (int) $rows->sum('active_visit_count'),
                'total_dwell_hours' => round((float) $rows->sum('total_dwell_minutes') / 60, 1),
                'average_dwell_minutes' => $averageDwellMinutes,
            ],
            'top_visited_locations' => $rows
                ->filter(fn (array $row) => $row['entry_count'] > 0)
                ->sortByDesc('entry_count')
                ->take(5)
                ->map(fn (array $row) => [
                    'geofence_id' => $row['geofence_id'],
                    'name' => $row['name'],
                    'entry_count' => $row['entry_count'],
                    'unique_vehicle_count' => $row['unique_vehicle_count'],
                ])
                ->values()
                ->all(),
            'longest_dwell_locations' => $rows
                ->filter(fn (array $row) => $row['average_dwell_minutes'] !== null)
                ->sortByDesc('average_dwell_minutes')
                ->take(5)
                ->map(fn (array $row) => [
                    'geofence_id' => $row['geofence_id'],
                    'name' => $row['name'],
                    'average_dwell_minutes' => $row['average_dwell_minutes'],
                    'total_dwell_minutes' => $row['total_dwell_minutes'],
                ])
                ->values()
                ->all(),
        ];
    }

    private function baseGeofenceQuery(User $user): Builder
    {
        return Geofence::query()
            ->when(
                ! $user->isSuperAdmin(),
                fn (Builder $query) => $query->where('company_id', $user->company_id)
            );
    }

    private function baseAlertQuery(User $user, Carbon $windowStart, array $geofenceIds = []): Builder
    {
        return Alert::query()
            ->whereIn('type', [AlertType::GeofenceEntry, AlertType::GeofenceExit])
            ->where('triggered_at', '>=', $windowStart)
            ->when(
                ! $user->isSuperAdmin(),
                fn (Builder $query) => $query->where('company_id', $user->company_id)
            )
            ->when(
                $geofenceIds !== [],
                fn (Builder $query) => $this->applyGeofenceFilter($query, $geofenceIds)
            );
    }

    private function activeVisitCounts(User $user, array $geofenceIds): array
    {
        if ($geofenceIds === []) {
            return [];
        }

        return $this->baseUnresolvedEntryQuery($user, $geofenceIds)
            ->selectRaw($this->geofenceIdSelectExpression())
            ->selectRaw('COUNT(*) as active_visit_count')
            ->groupBy(DB::raw($this->geofenceIdGroupExpression()))
            ->pluck('active_visit_count', 'geofence_id')
            ->mapWithKeys(fn ($count, $geofenceId) => [(int) $geofenceId => (int) $count])
            ->all();
    }

    private function baseUnresolvedEntryQuery(User $user, array $geofenceIds): Builder
    {
        return Alert::query()
            ->where('type', AlertType::GeofenceEntry)
            ->whereNull('resolved_at')
            ->when(
                ! $user->isSuperAdmin(),
                fn (Builder $query) => $query->where('company_id', $user->company_id)
            )
            ->when(
                $geofenceIds !== [],
                fn (Builder $query) => $this->applyGeofenceFilter($query, $geofenceIds)
            );
    }

    private function windowedStatsByGeofence(User $user, Carbon $windowStart, array $geofenceIds): array
    {
        if ($geofenceIds === []) {
            return [];
        }

        $entryType = AlertType::GeofenceEntry->value;
        $exitType = AlertType::GeofenceExit->value;

        return $this->baseAlertQuery($user, $windowStart, $geofenceIds)
            ->selectRaw($this->geofenceIdSelectExpression())
            ->selectRaw('SUM(CASE WHEN type = ? THEN 1 ELSE 0 END) as entry_count', [$entryType])
            ->selectRaw('SUM(CASE WHEN type = ? THEN 1 ELSE 0 END) as exit_count', [$exitType])
            ->selectRaw('COUNT(DISTINCT CASE WHEN vehicle_id IS NOT NULL THEN vehicle_id END) as unique_vehicle_count')
            ->selectRaw('MAX(CASE WHEN type = ? THEN triggered_at END) as latest_entry_at', [$entryType])
            ->selectRaw('MAX(CASE WHEN type = ? THEN triggered_at END) as latest_exit_at', [$exitType])
            ->selectRaw($this->dwellMinutesAggregateExpression(), [$entryType])
            ->selectRaw('SUM(CASE WHEN type = ? AND resolved_at IS NOT NULL THEN 1 ELSE 0 END) as dwell_sample_count', [$entryType])
            ->groupBy(DB::raw($this->geofenceIdGroupExpression()))
            ->get()
            ->keyBy('geofence_id')
            ->all();
    }

    private function applyGeofenceFilter(Builder $query, array $geofenceIds): Builder
    {
        return $query->whereIn('context->geofence_id', $geofenceIds);
    }

    private function geofenceIdSelectExpression(): string
    {
        return match (DB::connection()->getDriverName()) {
            'sqlite' => "CAST(json_extract(context, '$.geofence_id') AS integer) as geofence_id",
            default => "CAST(context->>'geofence_id' AS integer) as geofence_id",
        };
    }

    private function geofenceIdGroupExpression(): string
    {
        return match (DB::connection()->getDriverName()) {
            'sqlite' => "CAST(json_extract(context, '$.geofence_id') AS integer)",
            default => "CAST(context->>'geofence_id' AS integer)",
        };
    }

    private function dwellMinutesAggregateExpression(): string
    {
        return match (DB::connection()->getDriverName()) {
            'sqlite' => "SUM(CASE WHEN type = ? AND resolved_at IS NOT NULL THEN (julianday(resolved_at) - julianday(triggered_at)) * 1440 ELSE 0 END) as total_dwell_minutes",
            default => "SUM(CASE WHEN type = ? AND resolved_at IS NOT NULL THEN EXTRACT(EPOCH FROM (resolved_at - triggered_at)) / 60 ELSE 0 END) as total_dwell_minutes",
        };
    }

    private function isoTimestamp(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return Carbon::parse($value)->toIso8601String();
    }

    private function escapeLike(string $value): string
    {
        return addcslashes($value, '\\%_');
    }
}
