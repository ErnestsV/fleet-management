<?php

namespace App\Domain\Ai\Tools;

use App\Domain\Ai\Contracts\AiCopilotTool;
use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Alerts\Models\Alert;
use App\Domain\Fleet\Services\Dashboard\DashboardQueryFactory;
use App\Models\User;

class GetAlertSummaryTool implements AiCopilotTool
{
    public function __construct(
        private readonly DashboardQueryFactory $dashboardQueryFactory,
    ) {
    }

    public function definition(): array
    {
        return [
            'name' => 'get_alert_summary',
            'description' => 'Get a concise summary of active actionable alerts and the most recent alert examples.',
            'parameters' => [
                'type' => 'object',
                'properties' => [
                    'limit' => [
                        'type' => ['integer', 'null'],
                        'description' => 'Maximum number of recent alerts to return.',
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
        $limit = min(max((int) ($arguments['limit'] ?? 5), 1), 10);
        $query = $this->dashboardQueryFactory
            ->activeActionableAlertsQuery($user->company_id, $user);

        $recentAlerts = (clone $query)
            ->with('vehicle:id,name,plate_number')
            ->latest('triggered_at')
            ->limit($limit)
            ->get()
            ->map(fn (Alert $alert) => [
                'id' => $alert->id,
                'type' => $alert->type->value,
                'severity' => $alert->severity,
                'message' => $alert->message,
                'triggered_at' => optional($alert->triggered_at)?->toIso8601String(),
                'vehicle' => $alert->vehicle
                    ? [
                        'id' => $alert->vehicle->id,
                        'name' => $alert->vehicle->name,
                        'plate_number' => $alert->vehicle->plate_number,
                    ]
                    : null,
            ])
            ->values()
            ->all();

        $breakdown = (clone $query)
            ->selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($row) => [
                'type' => $row instanceof Alert
                    ? (string) $row->getRawOriginal('type')
                    : ($row->type instanceof AlertType ? $row->type->value : (string) $row->type),
                'count' => (int) $row->count,
            ])
            ->values()
            ->all();

        return [
            'total_active_alerts' => (clone $query)->count(),
            'breakdown' => $breakdown,
            'recent_alerts' => $recentAlerts,
        ];
    }
}
