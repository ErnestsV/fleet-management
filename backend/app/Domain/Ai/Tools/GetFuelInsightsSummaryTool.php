<?php

namespace App\Domain\Ai\Tools;

use App\Domain\Ai\Contracts\AiCopilotTool;
use App\Domain\Fleet\Services\FuelInsightsService;
use App\Models\User;

class GetFuelInsightsSummaryTool implements AiCopilotTool
{
    public function __construct(
        private readonly FuelInsightsService $fuelInsightsService,
    ) {
    }

    public function definition(): array
    {
        return [
            'name' => 'get_fuel_insights_summary',
            'description' => 'Get the current fuel insights summary, anomaly counts, thresholds, and the most suspicious vehicles.',
            'parameters' => [
                'type' => 'object',
                'properties' => new \stdClass(),
                'required' => [],
                'additionalProperties' => false,
            ],
            'strict' => true,
        ];
    }

    public function execute(array $arguments, User $user): array
    {
        $summary = $this->fuelInsightsService->dashboardSummary($user);

        return [
            'summary' => [
                'active_anomalies' => $summary['active_anomalies'],
                'affected_vehicles' => $summary['affected_vehicles'],
                'unexpected_drop_count' => $summary['unexpected_drop_count'],
                'possible_theft_count' => $summary['possible_theft_count'],
                'refuel_without_trip_count' => $summary['refuel_without_trip_count'],
                'abnormal_consumption_count' => $summary['abnormal_consumption_count'],
            ],
            'thresholds' => $summary['thresholds'],
            'suspicious_vehicles' => collect($summary['suspicious_vehicles'])->take(8)->values()->all(),
        ];
    }
}
