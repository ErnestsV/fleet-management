<?php

namespace App\Domain\Alerts\Jobs;

use App\Domain\Alerts\Services\AlertEvaluationService;
use App\Domain\Telemetry\Models\TelemetryEvent;
use App\Domain\Telemetry\Models\VehicleState;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class EvaluateTelemetryAlertsJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly int $eventId,
        public readonly int $stateId,
    ) {
    }

    public function handle(AlertEvaluationService $service): void
    {
        $event = TelemetryEvent::find($this->eventId);
        $state = VehicleState::find($this->stateId);

        if ($event && $state) {
            $service->evaluateTelemetry($event, $state);
        }
    }
}
