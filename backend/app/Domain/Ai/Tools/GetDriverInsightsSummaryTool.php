<?php

namespace App\Domain\Ai\Tools;

use App\Domain\Ai\Contracts\AiCopilotTool;
use App\Domain\Fleet\Services\DriverInsightsService;
use App\Models\User;
use stdClass;

class GetDriverInsightsSummaryTool implements AiCopilotTool
{
    public function __construct(
        private readonly DriverInsightsService $driverInsightsService,
    ) {
    }

    public function definition(): array
    {
        return [
            'name' => 'get_driver_insights_summary',
            'description' => 'Get driver performance summary, coaching candidates, top performers, and trend deltas.',
            'parameters' => [
                'type' => 'object',
                'properties' => new stdClass(),
                'required' => [],
                'additionalProperties' => false,
            ],
            'strict' => true,
        ];
    }

    public function execute(array $arguments, User $user): array
    {
        $summary = $this->driverInsightsService->summary($user);

        return [
            'window' => $summary['window'],
            'headline' => $summary['headline'],
            'leaderboards' => $summary['leaderboards'],
            'drivers' => collect($summary['drivers'])
                ->map(fn (array $driver) => [
                    'driver_id' => $driver['driver_id'],
                    'name' => $driver['name'],
                    'trip_count' => $driver['trip_count'],
                    'distance_km' => $driver['distance_km'],
                    'speeding_alerts' => $driver['speeding_alerts'],
                    'idling_alerts' => $driver['idling_alerts'],
                    'score' => $driver['score'],
                    'score_delta' => $driver['score_delta'],
                ])
                ->take(10)
                ->values()
                ->all(),
        ];
    }
}
