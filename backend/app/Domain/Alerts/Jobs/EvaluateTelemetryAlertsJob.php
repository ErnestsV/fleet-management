<?php

namespace App\Domain\Alerts\Jobs;

use App\Domain\Alerts\Services\AlertEvaluationService;
use App\Domain\Telemetry\Models\TelemetryEvent;
use App\Domain\Telemetry\Models\VehicleState;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class EvaluateTelemetryAlertsJob implements ShouldQueue, ShouldBeUnique
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 120;

    public int $maxExceptions = 3;

    public array $backoff = [10, 60, 300];

    public int $uniqueFor = 600;

    public function __construct(
        public readonly int $eventId,
        public readonly int $stateId,
    ) {
    }

    public function handle(AlertEvaluationService $service): void
    {
        $event = TelemetryEvent::find($this->eventId);
        $state = VehicleState::find($this->stateId);

        if (! $event || ! $state) {
            Log::warning('Telemetry alert evaluation job skipped because event or state was missing.', [
                'event_id' => $this->eventId,
                'state_id' => $this->stateId,
                'event_found' => $event !== null,
                'state_found' => $state !== null,
            ]);

            return;
        }

        $service->evaluateTelemetry($event, $state);
    }

    public function uniqueId(): string
    {
        return (string) $this->eventId;
    }

    public function failed(Throwable $exception): void
    {
        Log::error('Telemetry alert evaluation job failed.', [
            'event_id' => $this->eventId,
            'state_id' => $this->stateId,
            'exception' => $exception::class,
            'message' => $exception->getMessage(),
        ]);
    }
}
