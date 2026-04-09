<?php

namespace App\Domain\Telemetry\Jobs;

use App\Domain\Telemetry\Models\TelemetryEvent;
use App\Domain\Telemetry\Services\TelemetryIngestionService;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessTelemetryEventJob implements ShouldQueue, ShouldBeUnique
{
    use Queueable;

    public int $tries = 5;

    public int $timeout = 60;

    public int $maxExceptions = 3;

    public array $backoff = [5, 15, 60, 180];

    public int $uniqueFor = 600;

    public function __construct(
        public readonly int $eventId,
    ) {
    }

    public function handle(TelemetryIngestionService $service): void
    {
        $event = TelemetryEvent::find($this->eventId);

        if (! $event) {
            Log::warning('Telemetry processing job skipped because event was missing.', [
                'event_id' => $this->eventId,
            ]);

            return;
        }

        $service->processStoredEvent($event);
    }

    public function uniqueId(): string
    {
        return (string) $this->eventId;
    }

    public function failed(Throwable $exception): void
    {
        app(TelemetryIngestionService::class)->markProcessingFailed($this->eventId, $exception->getMessage());

        Log::error('Telemetry processing job failed.', [
            'event_id' => $this->eventId,
            'exception' => $exception::class,
            'message' => $exception->getMessage(),
        ]);
    }
}
