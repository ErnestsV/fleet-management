<?php

namespace App\Domain\Ai\Tools;

use App\Domain\Ai\Contracts\AiCopilotTool;
use App\Domain\Telemetry\Services\TelemetryHealthService;
use App\Models\User;

class GetTelemetryHealthSummaryTool implements AiCopilotTool
{
    public function __construct(
        private readonly TelemetryHealthService $telemetryHealthService,
    ) {
    }

    public function definition(): array
    {
        return [
            'name' => 'get_telemetry_health_summary',
            'description' => 'Get telemetry health summary, freshness buckets, thresholds, and urgent vehicles with stale or missing telemetry.',
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
        $summary = $this->telemetryHealthService->summary($user);
        $paginated = $this->telemetryHealthService->paginated($user, [
            'per_page' => 10,
        ]);

        $urgentRows = collect($paginated['paginator']->items())
            ->sortBy(fn (array $row) => match ($row['health_status']) {
                'no_data' => 0,
                'offline' => 1,
                'stale' => 2,
                'missing_fields' => 3,
                'low_frequency' => 4,
                default => 5,
            })
            ->take(6)
            ->values()
            ->all();

        return [
            'summary' => $summary,
            'urgent_vehicles' => $urgentRows,
        ];
    }
}
