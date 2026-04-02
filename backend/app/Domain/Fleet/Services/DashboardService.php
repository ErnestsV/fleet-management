<?php

namespace App\Domain\Fleet\Services;

use App\Domain\Alerts\Models\Alert;
use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Fleet\Models\VehicleDriverAssignment;
use App\Domain\Trips\Models\Trip;
use App\Domain\Telemetry\Enums\VehicleStatus;
use App\Domain\Telemetry\Models\TelemetryEvent;
use App\Domain\Telemetry\Models\VehicleState;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function summary(User $user): array
    {
        $companyId = $user->company_id;
        $today = Carbon::today();
        $yesterday = $today->copy()->subDay();
        $windowStart = $today->copy()->subDays(6);
        $minimumBehaviourTripSamples = (int) env('FLEET_BEHAVIOUR_MIN_TRIPS', 3);
        $estimatedTankCapacityLiters = (float) env('FLEET_ESTIMATED_TANK_CAPACITY_LITERS', 100);
        $expectedFuelConsumptionPer100Km = (float) env('FLEET_EXPECTED_FUEL_CONSUMPTION_L_PER_100KM', 28);

        $vehicles = Vehicle::query()
            ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('company_id', $companyId));

        $states = VehicleState::query()
            ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('company_id', $companyId));

        $alerts = Alert::query()
            ->whereNull('resolved_at')
            ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('company_id', $companyId));

        $telemetryBase = TelemetryEvent::query()
            ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('company_id', $companyId))
            ->whereDate('occurred_at', '>=', $windowStart);

        $distanceToday = (clone $telemetryBase)
            ->whereDate('occurred_at', $today)
            ->sum('speed_kmh') / 10;

        $distanceYesterday = (clone $telemetryBase)
            ->whereDate('occurred_at', $yesterday)
            ->sum('speed_kmh') / 10;

        $distancePreviousDay = (clone $telemetryBase)
            ->whereDate('occurred_at', $yesterday->copy()->subDay())
            ->sum('speed_kmh') / 10;

        $fleetVehicles = Vehicle::query()
            ->with(['state', 'assignments.driver'])
            ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('company_id', $companyId))
            ->latest()
            ->get();

        $fleetRows = $fleetVehicles
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

        $alertsByType = collect(AlertType::cases())->map(fn (AlertType $type) => [
            'type' => $type->value,
            'count' => Alert::query()
                ->whereNull('resolved_at')
                ->where('type', $type)
                ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('company_id', $companyId))
                ->count(),
        ])->values();

        $distanceByVehicle = TelemetryEvent::query()
            ->selectRaw('vehicle_id, ROUND(COALESCE(SUM(speed_kmh) / 10, 0), 1) as distance_km')
            ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('company_id', $companyId))
            ->whereDate('occurred_at', '>=', $windowStart)
            ->groupBy('vehicle_id')
            ->with('vehicle:id,name,plate_number')
            ->limit(8)
            ->get()
            ->map(fn ($row) => [
                'vehicle_id' => $row->vehicle_id,
                'label' => $row->vehicle?->plate_number ?? 'Vehicle '.$row->vehicle_id,
                'distance_km' => (float) $row->distance_km,
            ])
            ->values();

        $tripsOverTime = Trip::query()
            ->selectRaw('DATE(start_time) as day, COUNT(*) as trip_count')
            ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('company_id', $companyId))
            ->whereDate('start_time', '>=', $windowStart)
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn ($row) => [
                'day' => $row->day,
                'trip_count' => (int) $row->trip_count,
            ])
            ->values();

        $activeAssignmentCount = VehicleDriverAssignment::query()
            ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('company_id', $companyId))
            ->whereNull('assigned_until')
            ->count();

        $freshTelemetryCount = (clone $states)
            ->where('last_event_at', '>=', now()->subMinutes((int) env('FLEET_OFFLINE_THRESHOLD_MINUTES', 10)))
            ->count();

        $tripVehicleIds = Trip::query()
            ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('company_id', $companyId))
            ->whereDate('start_time', '>=', $windowStart)
            ->distinct()
            ->pluck('vehicle_id');

        $vehiclesWithoutAlerts = $fleetVehicles->filter(function (Vehicle $vehicle) use ($companyId, $user) {
            return Alert::query()
                ->whereNull('resolved_at')
                ->where('vehicle_id', $vehicle->id)
                ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('company_id', $companyId))
                ->doesntExist();
        })->count();

        $fleetEfficiencyBreakdown = collect([
            [
                'label' => 'Utilization',
                'score' => $this->percent($tripVehicleIds->count(), max($fleetVehicles->count(), 1)),
            ],
            [
                'label' => 'Telemetry freshness',
                'score' => $this->percent($freshTelemetryCount, max($fleetVehicles->count(), 1)),
            ],
            [
                'label' => 'Driver coverage',
                'score' => $this->percent($activeAssignmentCount, max($fleetVehicles->count(), 1)),
            ],
            [
                'label' => 'Alert-free fleet',
                'score' => $this->percent($vehiclesWithoutAlerts, max($fleetVehicles->count(), 1)),
            ],
        ])->map(fn (array $item) => [
            ...$item,
            'score' => round($item['score'], 1),
        ])->values();

        $vehicleBehaviourScores = $fleetVehicles
            ->map(function (Vehicle $vehicle) use ($companyId, $user, $windowStart) {
                $recentTrips = Trip::query()
                    ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('company_id', $companyId))
                    ->where('vehicle_id', $vehicle->id)
                    ->whereDate('start_time', '>=', $windowStart)
                    ->get(['average_speed_kmh']);

                $speedingAlerts = Alert::query()
                    ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('company_id', $companyId))
                    ->where('vehicle_id', $vehicle->id)
                    ->where('type', AlertType::Speeding)
                    ->whereDate('triggered_at', '>=', $windowStart)
                    ->count();

                $idlingAlerts = Alert::query()
                    ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('company_id', $companyId))
                    ->where('vehicle_id', $vehicle->id)
                    ->where('type', AlertType::ProlongedIdling)
                    ->whereDate('triggered_at', '>=', $windowStart)
                    ->count();

                $averageSpeed = (float) ($recentTrips->avg('average_speed_kmh') ?? 0);
                $baseScore = $averageSpeed > 0 ? min(100, 72 + max(0, 18 - abs(55 - $averageSpeed))) : 70;
                $penalty = ($speedingAlerts * 8) + ($idlingAlerts * 4);
                $score = max(0, min(100, $baseScore - $penalty));

                return [
                    'vehicle_id' => $vehicle->id,
                    'label' => $vehicle->plate_number,
                    'name' => $vehicle->name,
                    'trip_count' => $recentTrips->count(),
                    'score' => round($score, 1),
                ];
            })
            ->map(fn (array $item) => [
                ...$item,
                'insufficient_data' => $item['trip_count'] < $minimumBehaviourTripSamples,
            ])
            ->values();

        $behaviourScoredVehicles = $vehicleBehaviourScores
            ->filter(fn (array $item) => ! $item['insufficient_data'])
            ->sortByDesc('score')
            ->values();

        $behaviourNeedsCoaching = $behaviourScoredVehicles
            ->sortBy('score')
            ->filter(fn (array $item) => $item['score'] < 60)
            ->values();

        $todayTrips = Trip::query()
            ->with('vehicle:id,name,plate_number')
            ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('company_id', $companyId))
            ->whereDate('start_time', $today)
            ->whereNotNull('end_time')
            ->get();

        $workingTime = [
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

        $windowEnd = $today->copy()->endOfDay();

        $fuelRows = DB::query()
            ->fromSub(
                TelemetryEvent::query()
                    ->selectRaw("DATE(occurred_at) as day")
                    ->selectRaw('vehicle_id')
                    ->selectRaw('odometer_km')
                    ->selectRaw('fuel_level')
                    ->selectRaw('LAG(fuel_level) OVER (PARTITION BY DATE(occurred_at), vehicle_id ORDER BY occurred_at) as previous_fuel_level')
                    ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('company_id', $companyId))
                    ->whereBetween('occurred_at', [$windowStart->copy()->startOfDay(), $windowEnd])
                    ->whereNotNull('odometer_km')
                    ->whereNotNull('fuel_level'),
                'daily_telemetry'
            )
            ->selectRaw('day')
            ->selectRaw('vehicle_id')
            ->selectRaw('COUNT(*) as sample_count')
            ->selectRaw('AVG(fuel_level) as avg_fuel_level_pct')
            ->selectRaw('MAX(odometer_km) - MIN(odometer_km) as distance_km')
            ->selectRaw('SUM(CASE WHEN previous_fuel_level IS NOT NULL AND fuel_level < previous_fuel_level THEN previous_fuel_level - fuel_level ELSE 0 END) as fuel_drop_pct')
            ->groupBy('day', 'vehicle_id')
            ->get()
            ->groupBy('day');

        $fuelTrend = collect(range(0, 6))
            ->map(fn (int $offset) => $windowStart->copy()->addDays($offset))
            ->map(function (Carbon $day) use ($fuelRows, $estimatedTankCapacityLiters) {
                $dayRows = collect($fuelRows->get($day->toDateString(), []))
                    ->filter(fn ($row) => (int) $row->sample_count >= 2)
                    ->values();

                if ($dayRows->isEmpty()) {
                    return [
                        'day' => $day->toDateString(),
                        'avg_fuel_level_pct' => null,
                        'distance_km' => null,
                        'estimated_fuel_used_l' => null,
                        'estimated_consumption_l_per_100km' => null,
                    ];
                }

                $avgFuelLevelPct = (float) ($dayRows->avg('avg_fuel_level_pct') ?? 0);
                $totalDistanceKm = (float) $dayRows->sum(fn ($row) => max(0, (float) $row->distance_km));
                $totalFuelUsedLiters = (float) $dayRows->sum(
                    fn ($row) => (((float) $row->fuel_drop_pct) / 100) * $estimatedTankCapacityLiters
                );

                return [
                    'day' => $day->toDateString(),
                    'avg_fuel_level_pct' => round($avgFuelLevelPct, 1),
                    'distance_km' => round($totalDistanceKm, 1),
                    'estimated_fuel_used_l' => round($totalFuelUsedLiters, 1),
                    'estimated_consumption_l_per_100km' => $totalDistanceKm > 0
                        ? round(($totalFuelUsedLiters / $totalDistanceKm) * 100, 1)
                        : null,
                ];
            })
            ->values();

        $fuelYesterday = $fuelTrend->firstWhere('day', $yesterday->toDateString());
        $fuelPreviousDay = $fuelTrend->firstWhere('day', $yesterday->copy()->subDay()->toDateString());

        return [
            'total_vehicles' => $vehicles->count(),
            'moving_vehicles' => (clone $states)->where('status', VehicleStatus::Moving)->count(),
            'idling_vehicles' => (clone $states)->where('status', VehicleStatus::Idling)->count(),
            'active_alerts' => $alerts->count(),
            'trips_today' => Trip::query()
                ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('company_id', $companyId))
                ->whereDate('start_time', $today)
                ->count(),
            'distance_today_km' => round($distanceToday, 1),
            'alerts_by_type' => $alertsByType,
            'distance_by_vehicle' => $distanceByVehicle,
            'trips_over_time' => $tripsOverTime,
            'fleet' => $fleetRows,
            'fleet_efficiency' => [
                'selected_average_score' => round($fleetEfficiencyBreakdown->avg('score') ?? 0, 1),
                'breakdown' => $fleetEfficiencyBreakdown,
            ],
            'driving_behaviour' => [
                'has_data' => $behaviourScoredVehicles->isNotEmpty(),
                'minimum_trip_samples' => $minimumBehaviourTripSamples,
                'insufficient_vehicle_count' => $vehicleBehaviourScores->filter(fn (array $item) => $item['insufficient_data'])->count(),
                'average_score' => $behaviourScoredVehicles->isNotEmpty()
                    ? round($behaviourScoredVehicles->avg('score') ?? 0, 1)
                    : null,
                'vehicle_scores' => $behaviourScoredVehicles->take(8)->values(),
                'best_vehicles' => $behaviourScoredVehicles->take(5)->values(),
                'worst_vehicles' => $behaviourNeedsCoaching->take(5)->values(),
            ],
            'mileage' => [
                'yesterday_distance_km' => round($distanceYesterday, 1),
                'previous_distance_km' => round($distancePreviousDay, 1),
                'delta_pct' => $distancePreviousDay > 0
                    ? round((($distanceYesterday - $distancePreviousDay) / $distancePreviousDay) * 100, 1)
                    : null,
            ],
            'fuel' => [
                'trend' => $fuelTrend,
                'estimated_fuel_used_yesterday_l' => $fuelYesterday['estimated_fuel_used_l'] ?? null,
                'estimated_fuel_used_previous_day_l' => $fuelPreviousDay['estimated_fuel_used_l'] ?? null,
                'estimated_avg_consumption_yesterday_l_per_100km' => $fuelYesterday['estimated_consumption_l_per_100km'] ?? null,
                'estimated_avg_consumption_previous_day_l_per_100km' => $fuelPreviousDay['estimated_consumption_l_per_100km'] ?? null,
                'average_fuel_level_yesterday_pct' => $fuelYesterday['avg_fuel_level_pct'] ?? null,
                'expected_consumption_l_per_100km' => $expectedFuelConsumptionPer100Km,
                'delta_used_pct' => ($fuelPreviousDay['estimated_fuel_used_l'] ?? 0) > 0 && ($fuelYesterday['estimated_fuel_used_l'] ?? null) !== null
                    ? round((((float) $fuelYesterday['estimated_fuel_used_l'] - (float) $fuelPreviousDay['estimated_fuel_used_l']) / (float) $fuelPreviousDay['estimated_fuel_used_l']) * 100, 1)
                    : null,
            ],
            'working_time' => $workingTime,
        ];
    }

    private function percent(int $value, int $total): float
    {
        if ($total <= 0) {
            return 0;
        }

        return ($value / $total) * 100;
    }
}
