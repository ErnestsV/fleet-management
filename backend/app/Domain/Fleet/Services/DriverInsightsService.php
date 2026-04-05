<?php

namespace App\Domain\Fleet\Services;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Fleet\Models\Driver;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DriverInsightsService
{
    public function summary(User $user): array
    {
        $companyId = $user->company_id;
        $timezone = $user->timezone ?: config('app.timezone', 'UTC');
        $windowEnd = now();
        $windowStart = $windowEnd->copy()->subDays(7);
        $previousWindowEnd = $windowStart->copy();
        $previousWindowStart = $windowStart->copy()->subDays(7);

        $drivers = $this->visibleDriversQuery($companyId, $user)
            ->get(['id', 'name', 'is_active']);

        $currentTripStats = $this->tripStatsByDriver($companyId, $user, $windowStart, $windowEnd, $timezone);
        $currentAlertStats = $this->alertStatsByDriver($companyId, $user, $windowStart, $windowEnd);
        $previousTripStats = $this->tripStatsByDriver($companyId, $user, $previousWindowStart, $previousWindowEnd, $timezone);
        $previousAlertStats = $this->alertStatsByDriver($companyId, $user, $previousWindowStart, $previousWindowEnd);

        $driverRows = $drivers
            ->map(function (Driver $driver) use ($currentTripStats, $currentAlertStats, $previousTripStats, $previousAlertStats) {
                $currentTrips = $currentTripStats->get($driver->id);
                $currentAlerts = $currentAlertStats->get($driver->id);
                $previousTrips = $previousTripStats->get($driver->id);
                $previousAlerts = $previousAlertStats->get($driver->id);

                $tripCount = (int) ($currentTrips->trip_count ?? 0);
                $distanceKmRaw = (float) ($currentTrips->distance_km ?? 0);
                $distanceKm = round($distanceKmRaw, 1);
                $speedingAlerts = (int) ($currentAlerts->speeding_alerts ?? 0);
                $idlingAlerts = (int) ($currentAlerts->idling_alerts ?? 0);
                $previousScore = $this->buildDriverScore(
                    tripCount: (int) ($previousTrips->trip_count ?? 0),
                    distanceKm: (float) ($previousTrips->distance_km ?? 0),
                    speedingAlerts: (int) ($previousAlerts->speeding_alerts ?? 0),
                    idlingAlerts: (int) ($previousAlerts->idling_alerts ?? 0),
                );
                $score = $this->buildDriverScore(
                    tripCount: $tripCount,
                    distanceKm: $distanceKm,
                    speedingAlerts: $speedingAlerts,
                    idlingAlerts: $idlingAlerts,
                );

                return [
                    'driver_id' => $driver->id,
                    'name' => $driver->name,
                    'is_active' => (bool) $driver->is_active,
                    'trip_count' => $tripCount,
                    'distance_km_raw' => $distanceKmRaw,
                    'distance_km' => $distanceKm,
                    'avg_trip_distance_km' => $tripCount > 0 ? round($distanceKm / $tripCount, 1) : 0.0,
                    'avg_trip_duration_minutes' => round((float) ($currentTrips->avg_trip_duration_minutes ?? 0), 1),
                    'duration_seconds' => (int) ($currentTrips->duration_seconds ?? 0),
                    'total_drive_hours' => round((float) ($currentTrips->total_drive_hours ?? 0), 1),
                    'after_hours_trip_count' => (int) ($currentTrips->after_hours_trip_count ?? 0),
                    'speeding_alerts' => $speedingAlerts,
                    'idling_alerts' => $idlingAlerts,
                    'score' => $score,
                    'previous_score' => $previousScore,
                    'score_delta' => $score !== null && $previousScore !== null ? round($score - $previousScore, 1) : null,
                    'has_activity' => $tripCount > 0,
                ];
            })
            ->sortByDesc(fn (array $driver) => [$driver['has_activity'], $driver['distance_km'], $driver['trip_count'], $driver['score'] ?? -1])
            ->values();

        $activeDrivers = $driverRows->filter(fn (array $driver) => $driver['has_activity']);
        $scoredDrivers = $driverRows->filter(fn (array $driver) => $driver['score'] !== null)->values();
        $totalTrips = (int) $activeDrivers->sum('trip_count');
        $totalDistanceKm = (float) $activeDrivers->sum('distance_km_raw');
        $totalDurationSeconds = (int) $activeDrivers->sum('duration_seconds');
        $improvedDrivers = $driverRows
            ->filter(fn (array $driver) => $driver['score_delta'] !== null)
            ->sortByDesc('score_delta')
            ->take(5)
            ->values()
            ->map(fn (array $driver) => [
                'driver_id' => $driver['driver_id'],
                'label' => $driver['name'],
                'score' => $driver['score_delta'],
            ]);

        return [
            'window' => [
                'label' => 'Last 7 days',
                'start' => $windowStart->toIso8601String(),
                'end' => $windowEnd->toIso8601String(),
            ],
            'headline' => [
                'active_drivers' => $activeDrivers->count(),
                'total_distance_km' => round($totalDistanceKm, 1),
                'total_trips' => $totalTrips,
                'average_trip_distance_km' => $totalTrips > 0
                    ? round($totalDistanceKm / $totalTrips, 1)
                    : null,
                'average_trip_duration_minutes' => $totalTrips > 0
                    ? round(($totalDurationSeconds / $totalTrips) / 60, 1)
                    : null,
                'total_drive_hours' => round($totalDurationSeconds / 3600, 1),
                'after_hours_trip_count' => $activeDrivers->sum('after_hours_trip_count'),
                'average_score' => $scoredDrivers->isNotEmpty()
                    ? round($scoredDrivers->avg('score') ?? 0, 1)
                    : null,
            ],
            'leaderboards' => [
                'top_drivers' => $scoredDrivers
                    ->sortByDesc('score')
                    ->take(5)
                    ->values()
                    ->map(fn (array $driver) => [
                        'driver_id' => $driver['driver_id'],
                        'label' => $driver['name'],
                        'score' => $driver['score'],
                    ]),
                'needs_coaching' => $scoredDrivers
                    ->sortBy('score')
                    ->filter(fn (array $driver) => $driver['speeding_alerts'] > 0 || $driver['idling_alerts'] > 0 || ($driver['score'] ?? 100) < 70)
                    ->take(5)
                    ->values()
                    ->map(fn (array $driver) => [
                        'driver_id' => $driver['driver_id'],
                        'label' => $driver['name'],
                        'score' => $driver['score'],
                    ]),
                'most_improved' => $improvedDrivers,
            ],
            'drivers' => $driverRows->values(),
        ];
    }

    private function tripStatsByDriver(?int $companyId, User $user, Carbon $windowStart, Carbon $windowEnd, string $timezone): Collection
    {
        $baseQuery = DB::table('vehicle_driver_assignments as assignments')
            ->join('trips', function ($join) {
                $join->on('trips.vehicle_id', '=', 'assignments.vehicle_id')
                    ->whereColumn('trips.start_time', '>=', 'assignments.assigned_from')
                    ->where(function ($query) {
                        $query->whereNull('assignments.assigned_until')
                            ->orWhereColumn('trips.start_time', '<', 'assignments.assigned_until');
                    });
            })
            ->when(
                ! $user->isSuperAdmin(),
                fn ($query) => $companyId === null
                    ? $query->whereRaw('1 = 0')
                    : $query->where('assignments.company_id', $companyId)
            )
            ->where('trips.start_time', '>=', $windowStart)
            ->where('trips.start_time', '<', $windowEnd);

        $tripAggregates = (clone $baseQuery)
            ->selectRaw('assignments.driver_id')
            ->selectRaw('COUNT(*) as trip_count')
            ->selectRaw('COALESCE(SUM(trips.distance_km), 0) as distance_km')
            ->selectRaw('COALESCE(SUM(trips.duration_seconds), 0) as duration_seconds')
            ->groupBy('assignments.driver_id')
            ->get()
            ->keyBy('driver_id');

        $afterHoursTripCounts = [];

        (clone $baseQuery)
            ->select([
                'assignments.driver_id',
                'trips.start_time',
            ])
            ->orderBy('assignments.driver_id')
            ->cursor()
            ->each(function ($row) use (&$afterHoursTripCounts, $timezone): void {
                if (! $this->isAfterHours(Carbon::parse($row->start_time), $timezone)) {
                    return;
                }

                $driverId = (int) $row->driver_id;
                $afterHoursTripCounts[$driverId] = ($afterHoursTripCounts[$driverId] ?? 0) + 1;
            });

        return $tripAggregates->map(function ($row) use ($afterHoursTripCounts) {
            $tripCount = (int) ($row->trip_count ?? 0);
            $distanceKm = round((float) ($row->distance_km ?? 0), 1);
            $durationSeconds = (int) ($row->duration_seconds ?? 0);
            $driverId = (int) ($row->driver_id ?? 0);

            return (object) [
                'trip_count' => $tripCount,
                'distance_km' => (float) ($row->distance_km ?? 0),
                'duration_seconds' => $durationSeconds,
                'avg_trip_duration_minutes' => $tripCount > 0 ? ($durationSeconds / $tripCount) / 60 : 0.0,
                'total_drive_hours' => $durationSeconds / 3600,
                'after_hours_trip_count' => $afterHoursTripCounts[$driverId] ?? 0,
            ];
        });
    }

    private function alertStatsByDriver(?int $companyId, User $user, Carbon $windowStart, Carbon $windowEnd): Collection
    {
        return DB::table('vehicle_driver_assignments as assignments')
            ->join('alerts', function ($join) {
                $join->on('alerts.vehicle_id', '=', 'assignments.vehicle_id')
                    ->whereColumn('alerts.triggered_at', '>=', 'assignments.assigned_from')
                    ->where(function ($query) {
                        $query->whereNull('assignments.assigned_until')
                            ->orWhereColumn('alerts.triggered_at', '<', 'assignments.assigned_until');
                    });
            })
            ->when(
                ! $user->isSuperAdmin(),
                fn ($query) => $companyId === null
                    ? $query->whereRaw('1 = 0')
                    : $query->where('assignments.company_id', $companyId)
            )
            ->where('alerts.triggered_at', '>=', $windowStart)
            ->where('alerts.triggered_at', '<', $windowEnd)
            ->whereIn('alerts.type', [AlertType::Speeding->value, AlertType::ProlongedIdling->value])
            ->selectRaw('assignments.driver_id')
            ->selectRaw('SUM(CASE WHEN alerts.type = ? THEN 1 ELSE 0 END) as speeding_alerts', [AlertType::Speeding->value])
            ->selectRaw('SUM(CASE WHEN alerts.type = ? THEN 1 ELSE 0 END) as idling_alerts', [AlertType::ProlongedIdling->value])
            ->groupBy('assignments.driver_id')
            ->get()
            ->keyBy('driver_id');
    }

    private function visibleDriversQuery(?int $companyId, User $user)
    {
        return Driver::query()
            ->whereNull('deleted_at')
            ->when(
                ! $user->isSuperAdmin(),
                fn ($query) => $companyId === null
                    ? $query->whereRaw('1 = 0')
                    : $query->where('company_id', $companyId)
            );
    }

    private function buildDriverScore(int $tripCount, float $distanceKm, int $speedingAlerts, int $idlingAlerts): ?float
    {
        if ($tripCount <= 0) {
            return null;
        }

        $avgTripDistanceKm = $distanceKm / max($tripCount, 1);
        $weightedAlerts = ($speedingAlerts * 1.25) + ($idlingAlerts * 0.9);
        $alertRatePer100Km = ($weightedAlerts * 100) / max($distanceKm, 1);
        $productivityBonus = min(18, $avgTripDistanceKm * 1.5) + min(12, $tripCount * 2);
        $penalty = min(70, $alertRatePer100Km * 10);
        $score = 70 + $productivityBonus - $penalty;

        return round(max(0, min(100, $score)), 1);
    }

    private function isAfterHours(Carbon $timestamp, string $timezone): bool
    {
        $localTimestamp = $timestamp->copy()->timezone($timezone);
        $startHour = (int) config('fleet.after_hours_start_hour', 7);
        $endHour = (int) config('fleet.after_hours_end_hour', 19);
        $hour = (int) $localTimestamp->format('G');

        return $hour < $startHour || $hour >= $endHour;
    }
}
