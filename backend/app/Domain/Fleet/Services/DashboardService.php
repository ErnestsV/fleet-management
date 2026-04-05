<?php

namespace App\Domain\Fleet\Services;

use App\Domain\Fleet\Services\Dashboard\DashboardFuelMileageReadService;
use App\Domain\Fleet\Services\Dashboard\DashboardOperationsReadService;
use App\Domain\Fleet\Services\Dashboard\DashboardPerformanceReadService;
use App\Domain\Fleet\Services\Dashboard\DashboardQueryFactory;
use App\Domain\Telemetry\Enums\VehicleStatus;
use App\Models\User;
use Illuminate\Support\Carbon;

class DashboardService
{
    public function __construct(
        private readonly DashboardQueryFactory $queryFactory,
        private readonly DashboardOperationsReadService $operationsReadService,
        private readonly DashboardPerformanceReadService $performanceReadService,
        private readonly DashboardFuelMileageReadService $fuelMileageReadService,
    ) {
    }

    public function summary(User $user): array
    {
        $companyId = $user->company_id;
        $today = Carbon::today();
        $yesterday = $today->copy()->subDay();
        $windowStart = $today->copy()->subDays(6);
        $minimumBehaviourTripSamples = (int) env('FLEET_BEHAVIOUR_MIN_TRIPS', 3);
        $estimatedTankCapacityLiters = (float) env('FLEET_ESTIMATED_TANK_CAPACITY_LITERS', 100);
        $expectedFuelConsumptionPer100Km = (float) env('FLEET_EXPECTED_FUEL_CONSUMPTION_L_PER_100KM', 28);

        $vehicles = $this->queryFactory->vehicleQuery($companyId, $user);
        $states = $this->queryFactory->stateQuery($companyId, $user);
        $alerts = $this->queryFactory->activeActionableAlertsQuery($companyId, $user);
        $fleetVehicles = $this->queryFactory->fleetVehiclesQuery($companyId, $user)
            ->latest()
            ->get();
        $fleetRows = $this->operationsReadService->buildFleetRows($fleetVehicles);
        $alertsByType = $this->performanceReadService->buildAlertsByType($companyId, $user);
        $distanceByVehicle = $this->operationsReadService->buildDistanceByVehicle($companyId, $user, $windowStart);
        $tripsOverTime = $this->operationsReadService->buildTripsOverTime($companyId, $user, $windowStart);
        $fleetEfficiencyBreakdown = $this->performanceReadService->buildFleetEfficiencyBreakdown($fleetVehicles, $states, $companyId, $user, $windowStart);
        $drivingBehaviour = $this->performanceReadService->buildDrivingBehaviour($fleetVehicles, $companyId, $user, $windowStart, $minimumBehaviourTripSamples);
        $fleetUtilization = $this->performanceReadService->buildFleetUtilizationSummary($fleetVehicles, $companyId, $user, $today);
        $workingTime = $this->operationsReadService->buildWorkingTime($companyId, $user, $today);
        $mileageAndFuel = $this->fuelMileageReadService->buildMileageAndFuelMetrics(
            companyId: $companyId,
            user: $user,
            today: $today,
            yesterday: $yesterday,
            windowStart: $windowStart,
            estimatedTankCapacityLiters: $estimatedTankCapacityLiters,
            expectedFuelConsumptionPer100Km: $expectedFuelConsumptionPer100Km,
        );

        return [
            'total_vehicles' => $vehicles->count(),
            'moving_vehicles' => (clone $states)->where('status', VehicleStatus::Moving)->count(),
            'idling_vehicles' => (clone $states)->where('status', VehicleStatus::Idling)->count(),
            'active_alerts' => $alerts->count(),
            'trips_today' => $this->queryFactory->tripQuery($companyId, $user)
                ->whereDate('start_time', $today)
                ->count(),
            'distance_today_km' => $mileageAndFuel['distance_today_km'],
            'alerts_by_type' => $alertsByType,
            'distance_by_vehicle' => $distanceByVehicle,
            'trips_over_time' => $tripsOverTime,
            'fleet' => $fleetRows,
            'fleet_efficiency' => [
                'selected_average_score' => round($fleetEfficiencyBreakdown->avg('score') ?? 0, 1),
                'breakdown' => $fleetEfficiencyBreakdown,
            ],
            'fleet_utilization' => $fleetUtilization,
            'driving_behaviour' => $drivingBehaviour,
            'mileage' => $mileageAndFuel['mileage'],
            'fuel' => $mileageAndFuel['fuel'],
            'working_time' => $workingTime,
        ];
    }
}
