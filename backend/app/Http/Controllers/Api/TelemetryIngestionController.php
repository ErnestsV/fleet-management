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
        [$event, $state] = $service->ingest($vehicle, $request->validated());

        return response()->json([
            'message' => 'Telemetry accepted.',
            'event_id' => $event->id,
            'vehicle_state' => [
                'vehicle_id' => $state->vehicle_id,
                'status' => $state->status?->value,
                'last_event_at' => $state->last_event_at,
            ],
        ], 202);
    }
}
