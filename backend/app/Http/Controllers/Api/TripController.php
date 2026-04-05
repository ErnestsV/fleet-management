<?php

namespace App\Http\Controllers\Api;

use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Trips\Models\Trip;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTripFilterRequest;
use App\Http\Resources\TripResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;

class TripController extends Controller
{
    public function index(StoreTripFilterRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Trip::class);

        $query = $this->buildTripsQuery($request);

        $summary = $this->buildTripSummary(clone $query, $request);

        return TripResource::collection($query->paginate((int) $request->integer('per_page', 15)))
            ->additional(['summary' => $summary]);
    }

    public function show(Request $request, Trip $trip): TripResource
    {
        $this->authorize('view', $trip);

        return new TripResource($trip->load('vehicle'));
    }

    public function vehicleHistory(StoreTripFilterRequest $request, Vehicle $vehicle): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Trip::class);
        $this->authorize('view', $vehicle);

        $query = $this->buildTripsQuery($request)
            ->where('vehicle_id', $vehicle->id);

        $summary = $this->buildTripSummary(clone $query, $request);

        return TripResource::collection($query->paginate((int) $request->integer('per_page', 15)))
            ->additional(['summary' => $summary]);
    }

    private function buildTripsQuery(StoreTripFilterRequest $request)
    {
        return Trip::query()
            ->with('vehicle')
            ->when(! $request->user()->isSuperAdmin(), fn ($builder) => $builder->where('company_id', $request->user()->company_id))
            ->when($request->integer('vehicle_id'), fn ($builder, $vehicleId) => $builder->where('vehicle_id', $vehicleId))
            ->when($request->string('search')->toString(), function ($builder, string $search) {
                $builder->whereHas('vehicle', function ($vehicleQuery) use ($search) {
                    $vehicleQuery->where(function ($inner) use ($search) {
                        $inner->where('name', 'like', "%{$search}%")
                            ->orWhere('plate_number', 'like', "%{$search}%")
                            ->orWhere('make', 'like', "%{$search}%")
                            ->orWhere('model', 'like', "%{$search}%");
                    });
                });
            })
            ->when($request->string('date_from')->toString(), fn ($builder, $dateFrom) => $builder->whereDate('start_time', '>=', $dateFrom))
            ->when($request->string('date_to')->toString(), fn ($builder, $dateTo) => $builder->whereDate('start_time', '<=', $dateTo))
            ->latest('start_time');
    }

    private function buildTripSummary($query, Request $request): array
    {
        $timezone = $request->user()?->timezone ?: config('app.timezone', 'UTC');
        $summaryQuery = (clone $query)
            ->reorder()
            ->getQuery();
        $aggregate = $summaryQuery
            ->selectRaw('COUNT(*) as trip_count')
            ->selectRaw('COALESCE(SUM(distance_km), 0) as total_distance_km')
            ->selectRaw('COALESCE(SUM(duration_seconds), 0) as total_duration_seconds')
            ->first();
        $tripCount = (int) ($aggregate->trip_count ?? 0);
        $totalDistanceKm = round((float) ($aggregate->total_distance_km ?? 0), 1);
        $totalDurationSeconds = (int) ($aggregate->total_duration_seconds ?? 0);
        $afterHoursTripCount = (clone $query)
            ->reorder()
            ->get(['start_time'])
            ->filter(fn (Trip $trip) => $this->isAfterHours($trip->start_time, $timezone))
            ->count();

        return [
            'trip_count' => $tripCount,
            'total_distance_km' => $totalDistanceKm,
            'average_trip_distance_km' => $tripCount > 0 ? round($totalDistanceKm / $tripCount, 1) : null,
            'average_trip_duration_minutes' => $tripCount > 0 ? round(($totalDurationSeconds / $tripCount) / 60, 1) : null,
            'total_drive_hours' => round($totalDurationSeconds / 3600, 1),
            'after_hours_trip_count' => $afterHoursTripCount,
        ];
    }

    private function isAfterHours(Carbon $timestamp, string $timezone): bool
    {
        $localTimestamp = $timestamp->copy()->timezone($timezone);
        $startHour = (int) env('FLEET_AFTER_HOURS_START_HOUR', 7);
        $endHour = (int) env('FLEET_AFTER_HOURS_END_HOUR', 19);
        $hour = (int) $localTimestamp->format('G');

        return $hour < $startHour || $hour >= $endHour;
    }
}
