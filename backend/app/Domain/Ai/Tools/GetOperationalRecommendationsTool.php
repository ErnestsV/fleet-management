<?php

namespace App\Domain\Ai\Tools;

use App\Domain\Ai\Contracts\AiCopilotTool;
use App\Domain\Fleet\Services\DashboardService;
use App\Domain\Fleet\Services\DriverInsightsService;
use App\Domain\Fleet\Services\FuelInsightsService;
use App\Domain\Maintenance\Models\MaintenanceSchedule;
use App\Domain\Telemetry\Services\TelemetryHealthService;
use App\Domain\Trips\Models\Trip;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class GetOperationalRecommendationsTool implements AiCopilotTool
{
    public function __construct(
        private readonly DashboardService $dashboardService,
        private readonly DriverInsightsService $driverInsightsService,
        private readonly FuelInsightsService $fuelInsightsService,
        private readonly TelemetryHealthService $telemetryHealthService,
    ) {
    }

    public function definition(): array
    {
        return [
            'name' => 'get_operational_recommendations',
            'description' => 'Return deterministic priority actions and follow-up recommendations based on current fleet, alert, telemetry, fuel, driver, maintenance, or trip conditions.',
            'parameters' => [
                'type' => 'object',
                'properties' => [
                    'focus' => [
                        'type' => ['string', 'null'],
                        'description' => 'Optional focus such as dashboard, alerts, telemetry, fuel, drivers, maintenance, trips, or general.',
                    ],
                ],
                'required' => ['focus'],
                'additionalProperties' => false,
            ],
            'strict' => true,
        ];
    }

    public function execute(array $arguments, User $user): array
    {
        $focus = $this->normalizeFocus((string) ($arguments['focus'] ?? 'general'));
        $dashboard = $this->dashboardService->summary($user);
        $telemetry = $this->telemetryHealthService->summary($user);
        $drivers = $this->driverInsightsService->summary($user);
        $fuel = $this->fuelInsightsService->dashboardSummary($user);
        $tripCount7d = $this->visibleTripsQuery($user)
            ->where('start_time', '>=', now()->subDays(7))
            ->whereNotNull('end_time')
            ->count();
        $overdueMaintenance = $this->countOverdueMaintenanceSchedules($user);

        $items = collect();

        if (data_get($dashboard, 'active_alerts', 0) > 0) {
            $items->push([
                'priority' => 100,
                'area' => 'alerts',
                'headline' => 'Work the active operational alerts first.',
                'why' => sprintf('%d actionable alerts are active right now.', (int) $dashboard['active_alerts']),
                'suggested_action' => 'Review the newest high-severity alerts, confirm real incidents, and clear false positives promptly.',
            ]);
        }

        if ((int) $telemetry['no_data_count'] > 0 || (int) $telemetry['offline_over_24h_count'] > 0) {
            $items->push([
                'priority' => 95,
                'area' => 'telemetry',
                'headline' => 'Investigate vehicles with missing or offline telemetry.',
                'why' => sprintf(
                    '%d vehicles have no data and %d have been offline beyond the threshold.',
                    (int) $telemetry['no_data_count'],
                    (int) $telemetry['offline_over_24h_count'],
                ),
                'suggested_action' => 'Check device connectivity, token validity, and whether inactive assets are still marked active.',
            ]);
        }

        if ((int) $fuel['active_anomalies'] > 0) {
            $topFuelVehicle = collect($fuel['suspicious_vehicles'])->first();
            $items->push([
                'priority' => 90,
                'area' => 'fuel',
                'headline' => 'Follow up on the active fuel anomaly backlog.',
                'why' => sprintf(
                    '%d active fuel anomalies are open%s.',
                    (int) $fuel['active_anomalies'],
                    $topFuelVehicle ? ' and '.data_get($topFuelVehicle, 'plate_number').' has the highest concentration right now' : '',
                ),
                'suggested_action' => 'Inspect supporting telemetry deltas, confirm whether the pattern reflects theft, refuel noise, or abnormal consumption, and resolve reviewed items.',
            ]);
        }

        $coachingCandidate = collect(data_get($drivers, 'leaderboards.needs_coaching', []))->first();

        if ($coachingCandidate) {
            $items->push([
                'priority' => 80,
                'area' => 'drivers',
                'headline' => 'Schedule follow-up with the main coaching candidate.',
                'why' => sprintf(
                    '%s is currently on the needs-coaching leaderboard.',
                    data_get($coachingCandidate, 'label', 'A driver')
                ),
                'suggested_action' => 'Review that driver’s recent speeding and idling patterns and plan coaching or policy follow-up.',
            ]);
        }

        if ($overdueMaintenance > 0) {
            $items->push([
                'priority' => 85,
                'area' => 'maintenance',
                'headline' => 'Resolve overdue maintenance schedules before adding more work.',
                'why' => sprintf('%d schedules are already due or overdue.', $overdueMaintenance),
                'suggested_action' => 'Prioritize the most overdue vehicles, record completed service, and verify next-due fields are moving forward correctly.',
            ]);
        }

        if ($tripCount7d === 0) {
            $items->push([
                'priority' => 60,
                'area' => 'trips',
                'headline' => 'Trip activity is unusually low.',
                'why' => 'No completed trips were found in the last 7 days.',
                'suggested_action' => 'Check whether the fleet is genuinely inactive or whether telemetry/state transitions are failing to close trips.',
            ]);
        }

        if ((float) data_get($dashboard, 'fleet_utilization.no_trips_today.percentage', 0) >= 40) {
            $items->push([
                'priority' => 70,
                'area' => 'utilization',
                'headline' => 'A large share of active vehicles has not completed trips today.',
                'why' => sprintf(
                    '%.0f%% of active vehicles have no trips today.',
                    (float) data_get($dashboard, 'fleet_utilization.no_trips_today.percentage', 0)
                ),
                'suggested_action' => 'Confirm dispatch activity, inactive fleet flags, and whether operators expect those vehicles to be moving today.',
            ]);
        }

        $filtered = $items
            ->when(
                $focus !== '' && $focus !== 'general',
                fn ($collection) => $collection->filter(fn (array $item) => $item['area'] === $focus || $focus === 'dashboard')
            )
            ->sortByDesc('priority')
            ->values();

        return [
            'focus' => $focus,
            'recommendations' => $filtered->take(6)->all(),
        ];
    }

    private function normalizeFocus(string $focus): string
    {
        $normalized = strtolower(trim($focus));

        return match ($normalized) {
            '', 'overview' => 'general',
            'driver_insights' => 'drivers',
            'fuel_insights' => 'fuel',
            'telemetry_health' => 'telemetry',
            'geofence_analytics' => 'dashboard',
            'utilization' => 'dashboard',
            default => $normalized,
        };
    }

    private function countOverdueMaintenanceSchedules(User $user): int
    {
        $today = today();

        return $this->visibleMaintenanceSchedulesQuery($user)
            ->with('vehicle.state')
            ->where('is_active', true)
            ->get()
            ->filter(function (MaintenanceSchedule $schedule) use ($today): bool {
                $stateOdometer = $schedule->vehicle?->state?->odometer_km;
                $dateStatus = match (true) {
                    $schedule->next_due_date === null => null,
                    $schedule->next_due_date->lt($today) => 'overdue',
                    default => null,
                };
                $odometerStatus = match (true) {
                    $schedule->next_due_odometer_km === null || $stateOdometer === null => null,
                    $stateOdometer >= $schedule->next_due_odometer_km => 'overdue',
                    default => null,
                };

                return in_array('overdue', [$dateStatus, $odometerStatus], true);
            })
            ->count();
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

    private function visibleMaintenanceSchedulesQuery(User $user): Builder
    {
        return MaintenanceSchedule::query()
            ->when(
                ! $user->isSuperAdmin(),
                fn (Builder $query) => $user->company_id === null
                    ? $query->whereRaw('1 = 0')
                    : $query->where('company_id', $user->company_id)
            );
    }
}
