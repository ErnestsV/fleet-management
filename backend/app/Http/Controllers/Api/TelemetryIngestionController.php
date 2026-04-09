<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\IngestTelemetryRequest;
use App\Domain\Telemetry\Services\TelemetryIngestionService;
use Illuminate\Http\JsonResponse;

class TelemetryIngestionController extends Controller
{
    public function store(IngestTelemetryRequest $request, TelemetryIngestionService $service): JsonResponse
    {
        $rawToken = (string) $request->bearerToken();
        $vehicle = $service->resolveVehicleFromToken($rawToken, $request->integer('vehicle_id') ?: null);
        [$event, $created] = $service->ingest(
            $vehicle,
            $request->validated(),
            $this->resolveMessageId($request),
        );

        return response()->json([
            'message' => $created ? 'Telemetry accepted.' : 'Duplicate telemetry accepted.',
            'event_id' => $event->id,
            'duplicate' => ! $created,
            'processing_status' => $event->processed_at !== null ? 'processed' : 'queued',
        ], 202);
    }

    private function resolveMessageId(IngestTelemetryRequest $request): ?string
    {
        $messageId = trim((string) (
            $request->header('X-Device-Message-Id')
            ?: $request->header('X-Idempotency-Key')
            ?: $request->input('message_id')
        ));

        return $messageId !== '' ? $messageId : null;
    }
}
