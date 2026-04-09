<?php

namespace App\Domain\Fleet\Services\Dashboard;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Alerts\Models\Alert;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Fleet\Models\VehicleDriverAssignment;
use App\Domain\Telemetry\Enums\VehicleStatus;
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
        $alertsByType = $this->queryFactory->activeActionableAlertsQuery($companyId, $user)
            ->selectRaw('type')
            ->selectRaw('COUNT(*) as aggregate_count')
            ->groupBy('type')
            ->get()
            ->mapWithKeys(function (Alert $alert) {
                $type = (string) $alert->getRawOriginal('type');

                return [$type => (int) $alert->aggregate_count];
            });
        $informationalTypes = $this->queryFactory->informationalAlertTypes();

        return collect(AlertType::cases())->map(fn (AlertType $type) => [
            'type' => $type->value,
            'count' => in_array($type, $informationalTypes, true)
                ? 0
                : (int) ($alertsByType[$type->value] ?? 0),
        ])->values();
    }

    public function buildFleetEfficiencyBreakdown($fleetVehicles, $states, ?int $companyId, User $user, Carbon $windowStart)
    {
        $fleetVehicleIds = $fleetVehicles->pluck('id');

        $activeAssignmentCount = $this->scopedAssignmentsQuery($companyId, $user)
            ->whereIn('vehicle_id', $fleetVehicleIds)
            ->whereNull('assigned_until')
            ->distinct('vehicle_id')
            ->count('vehicle_id');

        $freshMinutes = max((int) config('fleet.telemetry_fresh_minutes', 15), 1);

        $freshTelemetryVehicleIds = (clone $states)
            ->whereIn('vehicle_id', $fleetVehicleIds)
            ->where('last_event_at', '>=', now()->subMinutes($freshMinutes))
            ->pluck('vehicle_id')
            ->unique();

        $tripVehicleIds = $this->queryFactory->tripQuery($companyId, $user)
            ->whereIn('vehicle_id', $fleetVehicleIds)
            ->whereDate('start_time', '>=', $windowStart)
            ->distinct()
            ->pluck('vehicle_id');

        $alertedVehicleIds = $this->queryFactory->activeActionableAlertsQuery($companyId, $user)
            ->whereIn('vehicle_id', $fleetVehicleIds)
            ->whereNotNull('vehicle_id')
            ->distinct()
            ->pluck('vehicle_id')
            ->all();

        $vehiclesWithoutAlerts = $fleetVehicles
            ->reject(fn (Vehicle $vehicle) => in_array($vehicle->id, $alertedVehicleIds, true))
            ->count();

        return collect([
            [
                'label' => 'Utilization',
                'score' => $this->percent($tripVehicleIds->count(), max($fleetVehicles->count(), 1)),
            ],
            [
                'label' => 'Telemetry freshness',
                'score' => $this->percent($freshTelemetryVehicleIds->count(), max($fleetVehicles->count(), 1)),
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
        $vehicleIds = $fleetVehicles->pluck('id');

        $tripStatsByVehicle = $this->queryFactory->tripQuery($companyId, $user)
            ->whereIn('vehicle_id', $vehicleIds)
            ->whereDate('start_time', '>=', $windowStart)
            ->selectRaw('vehicle_id')
            ->selectRaw('COUNT(*) as trip_count')
            ->selectRaw('AVG(average_speed_kmh) as average_speed_kmh')
            ->groupBy('vehicle_id')
            ->get()
            ->keyBy('vehicle_id');

        $alertCountsByVehicle = $this->scopedAlertsQuery($companyId, $user)
            ->whereIn('vehicle_id', $vehicleIds)
            ->whereIn('type', [AlertType::Speeding, AlertType::ProlongedIdling])
            ->whereDate('triggered_at', '>=', $windowStart)
            ->selectRaw('vehicle_id')
            ->selectRaw('SUM(CASE WHEN type = ? THEN 1 ELSE 0 END) as speeding_alerts', [AlertType::Speeding->value])
            ->selectRaw('SUM(CASE WHEN type = ? THEN 1 ELSE 0 END) as idling_alerts', [AlertType::ProlongedIdling->value])
            ->groupBy('vehicle_id')
            ->get()
            ->keyBy('vehicle_id');

        $vehicleBehaviourScores = $fleetVehicles
            ->map(function (Vehicle $vehicle) use ($tripStatsByVehicle, $alertCountsByVehicle) {
                $tripStats = $tripStatsByVehicle->get($vehicle->id);
                $alertCounts = $alertCountsByVehicle->get($vehicle->id);
                $tripCount = (int) ($tripStats?->trip_count ?? 0);
                $averageSpeed = (float) ($tripStats?->average_speed_kmh ?? 0);
                $speedingAlerts = (int) ($alertCounts?->speeding_alerts ?? 0);
                $idlingAlerts = (int) ($alertCounts?->idling_alerts ?? 0);
                $baseScore = $averageSpeed > 0 ? min(100, 72 + max(0, 18 - abs(55 - $averageSpeed))) : 70;
                $penalty = ($speedingAlerts * 8) + ($idlingAlerts * 4);
                $score = max(0, min(100, $baseScore - $penalty));

                return [
                    'vehicle_id' => $vehicle->id,
                    'label' => $vehicle->plate_number,
                    'name' => $vehicle->name,
                    'trip_count' => $tripCount,
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

    public function buildFleetUtilizationSummary($fleetVehicles, ?int $companyId, User $user, Carbon $today): array
    {
        $fleetVehicleIds = $fleetVehicles->pluck('id');
        $fleetCount = max($fleetVehicles->count(), 1);
        $unusedCutoff = now()->subDays(3);
        $idleThresholdHours = max((int) config('fleet.dashboard_idle_threshold_hours', 2), 1);
        $shortTripThresholdKm = max((float) config('fleet.dashboard_short_trip_max_km', 5), 0.1);

        $todayTripStatsByVehicle = $this->queryFactory->tripQuery($companyId, $user)
            ->whereIn('vehicle_id', $fleetVehicleIds)
            ->whereDate('start_time', $today)
            ->selectRaw('vehicle_id')
            ->selectRaw('COUNT(*) as trip_count')
            ->selectRaw('MAX(distance_km) as longest_trip_km')
            ->groupBy('vehicle_id')
            ->get()
            ->keyBy('vehicle_id');

        $recentTripVehicleIds = $this->queryFactory->tripQuery($companyId, $user)
            ->whereIn('vehicle_id', $fleetVehicleIds)
            ->where('start_time', '>=', $unusedCutoff)
            ->distinct()
            ->pluck('vehicle_id')
            ->all();

        $longIdleVehicleCount = $this->queryFactory->stateQuery($companyId, $user)
            ->whereIn('vehicle_id', $fleetVehicleIds)
            ->where('status', VehicleStatus::Idling)
            ->whereNotNull('idling_started_at')
            ->where('idling_started_at', '<=', now()->subHours($idleThresholdHours))
            ->count();

        $activeTodayCount = $todayTripStatsByVehicle->count();
        $noTripsTodayCount = $fleetVehicles->count() - $activeTodayCount;
        $unusedOverThreeDaysCount = $fleetVehicles
            ->reject(fn (Vehicle $vehicle) => in_array($vehicle->id, $recentTripVehicleIds, true))
            ->count();
        $shortTripsOnlyTodayCount = $todayTripStatsByVehicle
            ->filter(fn ($stats) => (int) ($stats->trip_count ?? 0) > 0 && (float) ($stats->longest_trip_km ?? 0) <= $shortTripThresholdKm)
            ->count();

        return [
            'active_today' => [
                'count' => $activeTodayCount,
                'percentage' => round($this->percent($activeTodayCount, $fleetCount), 1),
            ],
            'unused_over_3_days' => [
                'count' => $unusedOverThreeDaysCount,
                'percentage' => round($this->percent($unusedOverThreeDaysCount, $fleetCount), 1),
            ],
            'idling_over_threshold' => [
                'count' => $longIdleVehicleCount,
                'percentage' => round($this->percent($longIdleVehicleCount, $fleetCount), 1),
                'threshold_hours' => $idleThresholdHours,
            ],
            'no_trips_today' => [
                'count' => $noTripsTodayCount,
                'percentage' => round($this->percent($noTripsTodayCount, $fleetCount), 1),
            ],
            'short_trips_only_today' => [
                'count' => $shortTripsOnlyTodayCount,
                'percentage' => round($this->percent($shortTripsOnlyTodayCount, $fleetCount), 1),
                'max_trip_km' => round($shortTripThresholdKm, 1),
            ],
        ];
    }

    private function percent(int $value, int $total): float
    {
        if ($total <= 0) {
            return 0;
        }

        return ($value / $total) * 100;
    }

    private function scopedAssignmentsQuery(?int $companyId, User $user)
    {
        return VehicleDriverAssignment::query()
            ->when(
                $user->isSuperAdmin(),
                fn ($query) => $query,
                fn ($query) => $companyId === null
                    ? $query->whereRaw('1 = 0')
                    : $query->where('company_id', $companyId)
            );
    }

    private function scopedAlertsQuery(?int $companyId, User $user)
    {
        return Alert::query()
            ->when(
                $user->isSuperAdmin(),
                fn ($query) => $query,
                fn ($query) => $companyId === null
                    ? $query->whereRaw('1 = 0')
                    : $query->where('company_id', $companyId)
            );
    }
}
