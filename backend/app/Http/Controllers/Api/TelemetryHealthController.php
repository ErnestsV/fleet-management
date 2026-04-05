<?php

namespace App\Http\Controllers\Api;

use App\Domain\Telemetry\Models\VehicleState;
use App\Domain\Telemetry\Services\TelemetryHealthService;
use App\Http\Controllers\Controller;
use App\Http\Requests\TelemetryHealthIndexRequest;
use Illuminate\Http\JsonResponse;

class TelemetryHealthController extends Controller
{
    public function __invoke(TelemetryHealthIndexRequest $request, TelemetryHealthService $service): JsonResponse
    {
        $this->authorize('viewAny', VehicleState::class);

        $result = $service->paginated($request->user(), $request->validated());
        /** @var \Illuminate\Contracts\Pagination\LengthAwarePaginator $paginator */
        $paginator = $result['paginator'];

        return response()->json([
            'data' => $paginator->items(),
            'summary' => $result['summary'],
            'links' => [
                'first' => $paginator->url(1),
                'last' => $paginator->url($paginator->lastPage()),
                'prev' => $paginator->previousPageUrl(),
                'next' => $paginator->nextPageUrl(),
            ],
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'from' => $paginator->firstItem(),
                'last_page' => $paginator->lastPage(),
                'path' => $paginator->path(),
                'per_page' => $paginator->perPage(),
                'to' => $paginator->lastItem(),
                'total' => $paginator->total(),
            ],
        ]);
    }
}
