<?php

namespace App\Domain\Ai\Services;

use App\Domain\Ai\Contracts\AiCopilotTool;
use App\Domain\Ai\Support\AiCopilotContext;
use App\Domain\Ai\Tools\GetAlertSummaryTool;
use App\Domain\Ai\Tools\GetDashboardSummaryTool;
use App\Domain\Ai\Tools\GetDriverInsightsSummaryTool;
use App\Domain\Ai\Tools\GetFuelInsightsSummaryTool;
use App\Domain\Ai\Tools\GetGeofenceAnalyticsSummaryTool;
use App\Domain\Ai\Tools\GetTelemetryHealthSummaryTool;
use App\Domain\Ai\Tools\GetVehicleAttentionListTool;
use InvalidArgumentException;

class AiToolRegistry
{
    /**
     * @var array<string, AiCopilotTool>
     */
    private array $tools;

    /**
     * @var array<string, list<string>>
     */
    private array $contexts;

    public function __construct(
        GetDashboardSummaryTool $dashboardSummaryTool,
        GetAlertSummaryTool $alertSummaryTool,
        GetVehicleAttentionListTool $vehicleAttentionListTool,
        GetDriverInsightsSummaryTool $driverInsightsSummaryTool,
        GetFuelInsightsSummaryTool $fuelInsightsSummaryTool,
        GetTelemetryHealthSummaryTool $telemetryHealthSummaryTool,
        GetGeofenceAnalyticsSummaryTool $geofenceAnalyticsSummaryTool,
    ) {
        $this->tools = [
            $dashboardSummaryTool->definition()['name'] => $dashboardSummaryTool,
            $alertSummaryTool->definition()['name'] => $alertSummaryTool,
            $vehicleAttentionListTool->definition()['name'] => $vehicleAttentionListTool,
            $driverInsightsSummaryTool->definition()['name'] => $driverInsightsSummaryTool,
            $fuelInsightsSummaryTool->definition()['name'] => $fuelInsightsSummaryTool,
            $telemetryHealthSummaryTool->definition()['name'] => $telemetryHealthSummaryTool,
            $geofenceAnalyticsSummaryTool->definition()['name'] => $geofenceAnalyticsSummaryTool,
        ];

        $this->contexts = [
            AiCopilotContext::DASHBOARD => [
                'get_dashboard_summary',
                'get_alert_summary',
                'get_vehicle_attention_list',
                'get_driver_insights_summary',
            ],
            AiCopilotContext::DRIVER_INSIGHTS => [
                'get_driver_insights_summary',
            ],
            AiCopilotContext::FUEL_INSIGHTS => [
                'get_fuel_insights_summary',
            ],
            AiCopilotContext::TELEMETRY_HEALTH => [
                'get_telemetry_health_summary',
            ],
            AiCopilotContext::GEOFENCE_ANALYTICS => [
                'get_geofence_analytics_summary',
            ],
        ];
    }

    public function definitions(string $context): array
    {
        $allowedToolNames = $this->allowedToolNames($context);

        return array_map(
            fn (AiCopilotTool $tool) => array_merge($tool->definition(), ['type' => 'function']),
            array_map(fn (string $name) => $this->tools[$name], $allowedToolNames),
        );
    }

    public function tool(string $name, string $context): AiCopilotTool
    {
        if (! in_array($name, $this->allowedToolNames($context), true) || ! array_key_exists($name, $this->tools)) {
            throw new InvalidArgumentException("Unknown AI tool [{$name}].");
        }

        return $this->tools[$name];
    }

    /**
     * @return list<string>
     */
    private function allowedToolNames(string $context): array
    {
        if (! array_key_exists($context, $this->contexts)) {
            throw new InvalidArgumentException("Unknown AI copilot context [{$context}].");
        }

        return $this->contexts[$context];
    }
}
