<?php

namespace App\Domain\Fleet\Services\Dashboard;

use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Trips\Models\Trip;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardOperationsReadService
{
    public function __construct(
        private readonly DashboardQueryFactory $queryFactory,
    ) {
    }

    public function buildFleetRows($fleetVehicles)
    {
        return $fleetVehicles
            ->map(fn (Vehicle $vehicle) => [
                'id' => $vehicle->id,
                'name' => $vehicle->name,
                'plate_number' => $vehicle->plate_number,
                'make' => $vehicle->make,
                'model' => $vehicle->model,
                'status' => $vehicle->state?->status?->value,
                'latitude' => $vehicle->state?->latitude,
                'longitude' => $vehicle->state?->longitude,
                'heading' => $vehicle->state?->heading,
                'speed_kmh' => $vehicle->state?->speed_kmh,
                'fuel_level' => $vehicle->state?->fuel_level,
                'engine_on' => $vehicle->state?->engine_on,
                'last_event_at' => $vehicle->state?->last_event_at,
                'driver' => optional($vehicle->assignments->sortByDesc('assigned_from')->first()?->driver)->name,
            ])
            ->values();
    }

    public function buildDistanceByVehicle(?int $companyId, User $user, Carbon $windowStart)
    {
        $distanceByVehicleRows = DB::query()
            ->fromSub(
                $this->queryFactory->telemetryQuery($companyId, $user)
                    ->selectRaw('vehicle_id')
                    ->selectRaw('COUNT(*) as sample_count')
                    ->selectRaw('MAX(odometer_km) - MIN(odometer_km) as distance_km')
                    ->whereDate('occurred_at', '>=', $windowStart)
                    ->whereNotNull('odometer_km')
                    ->groupBy('vehicle_id'),
                'vehicle_distance_rollups'
            )
            ->selectRaw('vehicle_id')
            ->selectRaw('ROUND(COALESCE(SUM(CASE WHEN sample_count >= 2 AND distance_km > 0 THEN distance_km ELSE 0 END), 0), 1) as distance_km')
            ->groupBy('vehicle_id')
            ->orderByDesc('distance_km')
            ->orderBy('vehicle_id')
            ->limit(8)
            ->get();

        $distanceVehicleLabels = Vehicle::query()
            ->whereIn('id', $distanceByVehicleRows->pluck('vehicle_id'))
            ->get(['id', 'plate_number'])
            ->keyBy('id');

        return $distanceByVehicleRows
            ->map(fn ($row) => [
                'vehicle_id' => $row->vehicle_id,
                'label' => $distanceVehicleLabels->get($row->vehicle_id)?->plate_number ?? 'Vehicle '.$row->vehicle_id,
                'distance_km' => (float) $row->distance_km,
            ])
            ->values();
    }

    public function buildTripsOverTime(?int $companyId, User $user, Carbon $windowStart)
    {
        return $this->queryFactory->tripQuery($companyId, $user)
            ->selectRaw('DATE(start_time) as day, COUNT(*) as trip_count')
            ->whereDate('start_time', '>=', $windowStart)
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn ($row) => [
                'day' => $row->day,
                'trip_count' => (int) $row->trip_count,
            ])
            ->values();
    }

    public function buildWorkingTime(?int $companyId, User $user, Carbon $today): array
    {
        $todayTrips = $this->queryFactory->tripQuery($companyId, $user)
            ->with('vehicle:id,name,plate_number')
            ->whereDate('start_time', $today)
            ->whereNotNull('end_time')
            ->get();

        return [
            'earliest_start' => $todayTrips->sortBy('start_time')->take(4)->values()->map(fn (Trip $trip) => [
                'label' => $trip->vehicle?->plate_number ?? $trip->vehicle?->name ?? 'Vehicle '.$trip->vehicle_id,
                'time' => optional($trip->start_time)->format('H:i'),
            ]),
            'latest_start' => $todayTrips->sortByDesc('start_time')->take(4)->values()->map(fn (Trip $trip) => [
                'label' => $trip->vehicle?->plate_number ?? $trip->vehicle?->name ?? 'Vehicle '.$trip->vehicle_id,
                'time' => optional($trip->start_time)->format('H:i'),
            ]),
            'earliest_end' => $todayTrips->sortBy('end_time')->take(4)->values()->map(fn (Trip $trip) => [
                'label' => $trip->vehicle?->plate_number ?? $trip->vehicle?->name ?? 'Vehicle '.$trip->vehicle_id,
                'time' => optional($trip->end_time)->format('H:i'),
            ]),
            'latest_end' => $todayTrips->sortByDesc('end_time')->take(4)->values()->map(fn (Trip $trip) => [
                'label' => $trip->vehicle?->plate_number ?? $trip->vehicle?->name ?? 'Vehicle '.$trip->vehicle_id,
                'time' => optional($trip->end_time)->format('H:i'),
            ]),
        ];
    }
}
