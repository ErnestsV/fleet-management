<?php

namespace App\Domain\Ai\Tools;

use App\Domain\Ai\Contracts\AiCopilotTool;
use App\Domain\Trips\Models\Trip;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class GetTripSummaryTool implements AiCopilotTool
{
    public function definition(): array
    {
        return [
            'name' => 'get_trip_summary',
            'description' => 'Get recent trip activity, after-hours pressure, top-distance vehicles, and notable long trips.',
            'parameters' => [
                'type' => 'object',
                'properties' => [
                    'days' => [
                        'type' => ['integer', 'null'],
                        'description' => 'Rolling window size in days, capped at 30.',
                    ],
                ],
                'required' => ['days'],
                'additionalProperties' => false,
            ],
            'strict' => true,
        ];
    }

    public function execute(array $arguments, User $user): array
    {
        $days = min(max((int) ($arguments['days'] ?? 7), 1), 30);
        $timezone = $user->timezone ?: config('app.timezone', 'UTC');
        $windowEnd = now($timezone)->utc();
        $windowStart = $windowEnd->copy()->timezone($timezone)->subDays($days)->utc();
        $query = $this->visibleTripsQuery($user)
            ->where('start_time', '>=', $windowStart)
            ->where('start_time', '<=', $windowEnd);

        $aggregate = (clone $query)
            ->reorder()
            ->selectRaw('COUNT(*) as trip_count')
            ->selectRaw('COALESCE(SUM(distance_km), 0) as total_distance_km')
            ->selectRaw('COALESCE(SUM(duration_seconds), 0) as total_duration_seconds')
            ->first();

        $tripCount = (int) ($aggregate?->trip_count ?? 0);
        $totalDistance = (float) ($aggregate?->total_distance_km ?? 0);
        $totalDurationSeconds = (int) ($aggregate?->total_duration_seconds ?? 0);

        $afterHoursTripCount = (clone $query)
            ->reorder()
            ->select('start_time')
            ->cursor()
            ->filter(fn (Trip $trip) => $this->isAfterHours($trip->start_time, $timezone))
            ->count();

        $topVehicles = (clone $query)
            ->with('vehicle:id,name,plate_number')
            ->reorder()
            ->selectRaw('vehicle_id, COUNT(*) as trip_count, COALESCE(SUM(distance_km), 0) as distance_km')
            ->groupBy('vehicle_id')
            ->orderByDesc('distance_km')
            ->orderByDesc('trip_count')
            ->limit(8)
            ->get()
            ->map(fn (Trip $trip) => [
                'vehicle_id' => $trip->vehicle_id,
                'vehicle' => $trip->vehicle ? [
                    'id' => $trip->vehicle->id,
                    'name' => $trip->vehicle->name,
                    'plate_number' => $trip->vehicle->plate_number,
                ] : null,
                'trip_count' => (int) $trip->trip_count,
                'distance_km' => round((float) $trip->distance_km, 1),
            ])
            ->values()
            ->all();

        $notableTrips = (clone $query)
            ->with('vehicle:id,name,plate_number')
            ->reorder()
            ->orderByDesc('distance_km')
            ->orderByDesc('duration_seconds')
            ->take(6)
            ->get()
            ->map(fn (Trip $trip) => [
                'trip_id' => $trip->id,
                'vehicle' => $trip->vehicle ? [
                    'id' => $trip->vehicle->id,
                    'name' => $trip->vehicle->name,
                    'plate_number' => $trip->vehicle->plate_number,
                ] : null,
                'start_time' => $trip->start_time?->toIso8601String(),
                'distance_km' => $trip->distance_km,
                'duration_minutes' => round($trip->duration_seconds / 60, 1),
                'average_speed_kmh' => $trip->average_speed_kmh,
                'after_hours' => $this->isAfterHours($trip->start_time, $timezone),
            ])
            ->values()
            ->all();

        return [
            'window' => [
                'days' => $days,
                'start' => $windowStart->toIso8601String(),
                'end' => $windowEnd->toIso8601String(),
            ],
            'summary' => [
                'trip_count' => $tripCount,
                'total_distance_km' => round($totalDistance, 1),
                'average_trip_distance_km' => $tripCount > 0 ? round($totalDistance / $tripCount, 1) : null,
                'average_trip_duration_minutes' => $tripCount > 0 ? round(($totalDurationSeconds / $tripCount) / 60, 1) : null,
                'after_hours_trip_count' => $afterHoursTripCount,
            ],
            'top_vehicles' => $topVehicles,
            'notable_trips' => $notableTrips,
        ];
    }

    private function visibleTripsQuery(User $user): Builder
    {
        return Trip::query()
            ->when(
                ! $user->isSuperAdmin(),
                fn (Builder $query) => $user->company_id === null
                    ? $query->whereRaw('1 = 0')
                    : $query->where('company_id', $user->company_id)
            );
    }

    private function isAfterHours(?\Illuminate\Support\Carbon $timestamp, string $timezone): bool
    {
        if ($timestamp === null) {
            return false;
        }

        $localTimestamp = $timestamp->copy()->timezone($timezone);
        $startHour = (int) config('fleet.after_hours_start_hour', 7);
        $endHour = (int) config('fleet.after_hours_end_hour', 19);
        $hour = (int) $localTimestamp->format('G');

        if ($startHour === $endHour) {
            return true;
        }

        if ($startHour < $endHour) {
            return $hour < $startHour || $hour >= $endHour;
        }

        return $hour >= $startHour || $hour < $endHour;
    }
}
