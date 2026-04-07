<?php

namespace App\Domain\Ai\Services;

use App\Domain\Ai\Contracts\AiCopilotTool;
use App\Domain\Ai\Tools\GetAlertSummaryTool;
use App\Domain\Ai\Tools\GetDashboardSummaryTool;
use App\Domain\Ai\Tools\GetDriverInsightsSummaryTool;
use App\Domain\Ai\Tools\GetVehicleAttentionListTool;
use InvalidArgumentException;

class AiToolRegistry
{
    /**
     * @var array<string, AiCopilotTool>
     */
    private array $tools;

    public function __construct(
        GetDashboardSummaryTool $dashboardSummaryTool,
        GetAlertSummaryTool $alertSummaryTool,
        GetVehicleAttentionListTool $vehicleAttentionListTool,
        GetDriverInsightsSummaryTool $driverInsightsSummaryTool,
    ) {
        $this->tools = [
            $dashboardSummaryTool->definition()['name'] => $dashboardSummaryTool,
            $alertSummaryTool->definition()['name'] => $alertSummaryTool,
            $vehicleAttentionListTool->definition()['name'] => $vehicleAttentionListTool,
            $driverInsightsSummaryTool->definition()['name'] => $driverInsightsSummaryTool,
        ];
    }

    public function definitions(): array
    {
        return array_map(
            fn (AiCopilotTool $tool) => array_merge($tool->definition(), ['type' => 'function']),
            array_values($this->tools),
        );
    }

    public function tool(string $name): AiCopilotTool
    {
        if (! array_key_exists($name, $this->tools)) {
            throw new InvalidArgumentException("Unknown AI tool [{$name}].");
        }

        return $this->tools[$name];
    }
}
