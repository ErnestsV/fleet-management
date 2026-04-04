<?php

namespace App\Domain\Fleet\Services\Dashboard;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Alerts\Models\Alert;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Fleet\Models\VehicleDriverAssignment;
use App\Models\User;
use Illuminate\Support\Carbon;

class DashboardPerformanceReadService
{
    public function __construct(
        private readonly DashboardQueryFactory $queryFactory,
    ) {
    }

    public function buildAlertsByType(?int $companyId, User $user)
    {
        $alerts = $this->queryFactory->activeActionableAlertsQuery($companyId, $user);
        $informationalTypes = $this->queryFactory->informationalAlertTypes();

        return collect(AlertType::cases())->map(fn (AlertType $type) => [
            'type' => $type->value,
            'count' => in_array($type, $informationalTypes, true)
                ? 0
                : (clone $alerts)->where('type', $type)->count(),
        ])->values();
    }

    public function buildFleetEfficiencyBreakdown($fleetVehicles, $states, ?int $companyId, User $user, Carbon $windowStart)
    {
        $activeAssignmentCount = VehicleDriverAssignment::query()
            ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('company_id', $companyId))
            ->whereNull('assigned_until')
            ->count();

        $freshTelemetryCount = (clone $states)
            ->where('last_event_at', '>=', now()->subMinutes((int) env('FLEET_OFFLINE_THRESHOLD_MINUTES', 10)))
            ->count();

        $tripVehicleIds = $this->queryFactory->tripQuery($companyId, $user)
            ->whereDate('start_time', '>=', $windowStart)
            ->distinct()
            ->pluck('vehicle_id');

        $vehiclesWithoutAlerts = $fleetVehicles->filter(function (Vehicle $vehicle) use ($companyId, $user) {
            return $this->queryFactory->activeActionableAlertsQuery($companyId, $user)
                ->where('vehicle_id', $vehicle->id)
                ->doesntExist();
        })->count();

        return collect([
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
    }

    public function buildDrivingBehaviour($fleetVehicles, ?int $companyId, User $user, Carbon $windowStart, int $minimumBehaviourTripSamples): array
    {
        $vehicleBehaviourScores = $fleetVehicles
            ->map(function (Vehicle $vehicle) use ($companyId, $user, $windowStart) {
                $recentTrips = $this->queryFactory->tripQuery($companyId, $user)
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

        return [
            'has_data' => $behaviourScoredVehicles->isNotEmpty(),
            'minimum_trip_samples' => $minimumBehaviourTripSamples,
            'insufficient_vehicle_count' => $vehicleBehaviourScores->filter(fn (array $item) => $item['insufficient_data'])->count(),
            'average_score' => $behaviourScoredVehicles->isNotEmpty()
                ? round($behaviourScoredVehicles->avg('score') ?? 0, 1)
                : null,
            'vehicle_scores' => $behaviourScoredVehicles->take(8)->values(),
            'best_vehicles' => $behaviourScoredVehicles->take(5)->values(),
            'worst_vehicles' => $behaviourNeedsCoaching->take(5)->values(),
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
