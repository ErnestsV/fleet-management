<?php

namespace App\Domain\Geofences\Services;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Alerts\Models\Alert;
use App\Domain\Geofences\Models\Geofence;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
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

        $stats = [];

        foreach ($geofences as $geofence) {
            $stats[$geofence->id] = [
                'geofence_id' => $geofence->id,
                'name' => $geofence->name,
                'is_active' => $geofence->is_active,
                'entry_count' => 0,
                'exit_count' => 0,
                'unique_vehicle_ids' => [],
                'active_visit_count' => 0,
                'total_dwell_minutes' => 0.0,
                'dwell_sample_count' => 0,
                'latest_entry_at' => null,
                'latest_exit_at' => null,
            ];
        }

        foreach ($this->baseAlertQuery($user, $windowStart, $geofenceIds)->cursor() as $alert) {
            $geofenceId = (int) data_get($alert->context, 'geofence_id');

            if (! isset($stats[$geofenceId])) {
                continue;
            }

            if ($alert->vehicle_id !== null) {
                $stats[$geofenceId]['unique_vehicle_ids'][$alert->vehicle_id] = true;
            }

            if ($alert->type === AlertType::GeofenceEntry) {
                $stats[$geofenceId]['entry_count']++;

                if ($alert->resolved_at === null) {
                    $stats[$geofenceId]['active_visit_count']++;
                }

                if ($stats[$geofenceId]['latest_entry_at'] === null || $alert->triggered_at?->gt($stats[$geofenceId]['latest_entry_at'])) {
                    $stats[$geofenceId]['latest_entry_at'] = $alert->triggered_at;
                }

                if ($alert->resolved_at !== null && $alert->triggered_at !== null) {
                    $stats[$geofenceId]['total_dwell_minutes'] += (float) $alert->triggered_at->diffInMinutes($alert->resolved_at);
                    $stats[$geofenceId]['dwell_sample_count']++;
                }

                continue;
            }

            $stats[$geofenceId]['exit_count']++;

            if ($stats[$geofenceId]['latest_exit_at'] === null || $alert->triggered_at?->gt($stats[$geofenceId]['latest_exit_at'])) {
                $stats[$geofenceId]['latest_exit_at'] = $alert->triggered_at;
            }
        }

        foreach ($this->activeVisitCounts($user, $geofenceIds) as $geofenceId => $activeVisitCount) {
            if (! isset($stats[$geofenceId])) {
                continue;
            }

            $stats[$geofenceId]['active_visit_count'] = $activeVisitCount;
        }

        return collect($stats)
            ->map(function (array $row) {
                $averageDwellMinutes = $row['dwell_sample_count'] > 0
                    ? round($row['total_dwell_minutes'] / $row['dwell_sample_count'], 1)
                    : null;
                $lastActivityAt = collect([$row['latest_entry_at'], $row['latest_exit_at']])
                    ->filter()
                    ->sortDesc()
                    ->first();

                return [
                    'geofence_id' => $row['geofence_id'],
                    'name' => $row['name'],
                    'is_active' => (bool) $row['is_active'],
                    'entry_count' => $row['entry_count'],
                    'exit_count' => $row['exit_count'],
                    'unique_vehicle_count' => count($row['unique_vehicle_ids']),
                    'active_visit_count' => $row['active_visit_count'],
                    'resolved_visit_count' => $row['dwell_sample_count'],
                    'total_dwell_minutes' => round($row['total_dwell_minutes'], 1),
                    'average_dwell_minutes' => $averageDwellMinutes,
                    'latest_entry_at' => $row['latest_entry_at']?->toIso8601String(),
                    'latest_exit_at' => $row['latest_exit_at']?->toIso8601String(),
                    'last_activity_at' => $lastActivityAt?->toIso8601String(),
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
            )
            ->select(['vehicle_id', 'type', 'triggered_at', 'resolved_at', 'context'])
            ->orderBy('triggered_at');
    }

    private function activeVisitCounts(User $user, array $geofenceIds): array
    {
        if ($geofenceIds === []) {
            return [];
        }

        $counts = [];

        foreach ($this->baseUnresolvedEntryQuery($user, $geofenceIds)->cursor() as $alert) {
            $geofenceId = (int) data_get($alert->context, 'geofence_id');

            if ($geofenceId <= 0) {
                continue;
            }

            $counts[$geofenceId] = ($counts[$geofenceId] ?? 0) + 1;
        }

        return $counts;
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
            )
            ->select(['context'])
            ->orderBy('triggered_at');
    }

    private function applyGeofenceFilter(Builder $query, array $geofenceIds): Builder
    {
        return $query->whereIn('context->geofence_id', $geofenceIds);
    }

    private function escapeLike(string $value): string
    {
        return addcslashes($value, '\\%_');
    }
}
