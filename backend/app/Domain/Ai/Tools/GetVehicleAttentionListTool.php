<?php

namespace App\Domain\Ai\Tools;

use App\Domain\Ai\Contracts\AiCopilotTool;
use App\Domain\Fleet\Services\DashboardService;
use App\Models\User;

class GetVehicleAttentionListTool implements AiCopilotTool
{
    public function __construct(
        private readonly DashboardService $dashboardService,
    ) {
    }

    public function definition(): array
    {
        return [
            'name' => 'get_vehicle_attention_list',
            'description' => 'Get vehicles that need attention now based on missing driver assignment, stale telemetry, unknown status, or low fuel.',
            'parameters' => [
                'type' => 'object',
                'properties' => [
                    'limit' => [
                        'type' => ['integer', 'null'],
                        'description' => 'Maximum number of vehicles to return.',
                    ],
                ],
                'required' => ['limit'],
                'additionalProperties' => false,
            ],
            'strict' => true,
        ];
    }

    public function execute(array $arguments, User $user): array
    {
        $limit = min(max((int) ($arguments['limit'] ?? 5), 1), 12);
        $summary = $this->dashboardService->summary($user);

        $attentionVehicles = collect($summary['fleet'])
            ->map(function (array $vehicle) {
                $reasons = [];

                if (! $vehicle['driver']) {
                    $reasons[] = 'unassigned_driver';
                }

                if (! $vehicle['last_event_at']) {
                    $reasons[] = 'missing_telemetry';
                }

                if (! $vehicle['status'] || $vehicle['status'] === 'unknown') {
                    $reasons[] = 'unknown_status';
                }

                if (is_numeric($vehicle['fuel_level']) && (float) $vehicle['fuel_level'] <= 20) {
                    $reasons[] = 'low_fuel';
                }

                return [
                    'id' => $vehicle['id'],
                    'name' => $vehicle['name'],
                    'plate_number' => $vehicle['plate_number'],
                    'status' => $vehicle['status'],
                    'driver' => $vehicle['driver'],
                    'fuel_level' => $vehicle['fuel_level'],
                    'last_event_at' => $vehicle['last_event_at'],
                    'reasons' => $reasons,
                    'severity_score' => count($reasons),
                ];
            })
            ->filter(fn (array $vehicle) => $vehicle['reasons'] !== [])
            ->sortByDesc(fn (array $vehicle) => [$vehicle['severity_score'], $vehicle['last_event_at'] ?? ''])
            ->take($limit)
            ->values()
            ->map(fn (array $vehicle) => [
                'id' => $vehicle['id'],
                'name' => $vehicle['name'],
                'plate_number' => $vehicle['plate_number'],
                'status' => $vehicle['status'],
                'driver' => $vehicle['driver'],
                'fuel_level' => $vehicle['fuel_level'],
                'last_event_at' => $vehicle['last_event_at'],
                'reasons' => $vehicle['reasons'],
            ])
            ->all();

        return [
            'count' => count($attentionVehicles),
            'vehicles' => $attentionVehicles,
        ];
    }
}
