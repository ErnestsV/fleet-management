<?php

namespace App\Domain\Ai\Tools;

use App\Domain\Ai\Contracts\AiCopilotTool;
use App\Domain\Fleet\Services\DashboardService;
use App\Models\User;

class GetDashboardSummaryTool implements AiCopilotTool
{
    public function __construct(
        private readonly DashboardService $dashboardService,
    ) {
    }

    public function definition(): array
    {
        return [
            'name' => 'get_dashboard_summary',
            'description' => 'Get the current dashboard summary with fleet risk, utilization, telemetry health, fuel anomalies, geofence analytics, and top-level KPIs.',
            'parameters' => [
                'type' => 'object',
                'properties' => [
                    'focus' => [
                        'type' => ['string', 'null'],
                        'description' => 'Optional focus area such as risk, operations, fuel, telemetry, geofences, utilization, or overview.',
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
        $summary = $this->dashboardService->summary($user);
        $focus = strtolower(trim((string) ($arguments['focus'] ?? 'overview')));

        return [
            'focus' => $focus,
            'headline' => [
                'total_vehicles' => $summary['total_vehicles'],
                'moving_vehicles' => $summary['moving_vehicles'],
                'idling_vehicles' => $summary['idling_vehicles'],
                'active_alerts' => $summary['active_alerts'],
                'trips_today' => $summary['trips_today'],
                'distance_today_km' => $summary['distance_today_km'],
            ],
            'fleet_risk' => $summary['fleet_risk'],
            'fleet_utilization' => $summary['fleet_utilization'],
            'telemetry_health' => $summary['telemetry_health'],
            'fuel_anomalies' => $summary['fuel_anomalies'],
            'geofence_analytics' => $summary['geofence_analytics'] ?? null,
            'driving_behaviour' => [
                'has_data' => $summary['driving_behaviour']['has_data'],
                'average_score' => $summary['driving_behaviour']['average_score'],
                'worst_vehicles' => collect($summary['driving_behaviour']['worst_vehicles'])->take(5)->values()->all(),
                'best_vehicles' => collect($summary['driving_behaviour']['best_vehicles'])->take(5)->values()->all(),
            ],
            'alerts_by_type' => collect($summary['alerts_by_type'])->take(8)->values()->all(),
            'mileage' => $summary['mileage'],
            'fuel' => [
                'estimated_fuel_used_yesterday_l' => $summary['fuel']['estimated_fuel_used_yesterday_l'],
                'estimated_avg_consumption_yesterday_l_per_100km' => $summary['fuel']['estimated_avg_consumption_yesterday_l_per_100km'],
                'delta_used_pct' => $summary['fuel']['delta_used_pct'],
            ],
        ];
    }
}
