<?php

namespace App\Domain\Ai\Tools;

use App\Domain\Ai\Contracts\AiCopilotTool;
use App\Domain\Geofences\Services\GeofenceAnalyticsService;
use App\Models\User;

class GetGeofenceAnalyticsSummaryTool implements AiCopilotTool
{
    public function __construct(
        private readonly GeofenceAnalyticsService $geofenceAnalyticsService,
    ) {
    }

    public function definition(): array
    {
        return [
            'name' => 'get_geofence_analytics_summary',
            'description' => 'Get geofence analytics summary, most visited locations, longest dwell locations, and recent analytics rows.',
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
        $paginated = $this->geofenceAnalyticsService->paginated($user, [
            'per_page' => 10,
        ]);

        return [
            'summary' => $paginated['summary'],
            'rows' => collect($paginated['paginator']->items())->take(8)->values()->all(),
        ];
    }
}
