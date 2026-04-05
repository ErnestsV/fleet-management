<?php

namespace App\Http\Controllers\Api;

use App\Domain\Geofences\Models\Geofence;
use App\Domain\Geofences\Services\GeofenceAnalyticsService;
use App\Http\Controllers\Controller;
use App\Http\Requests\GeofenceAnalyticsIndexRequest;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;

class GeofenceAnalyticsController extends Controller
{
    public function __invoke(GeofenceAnalyticsIndexRequest $request, GeofenceAnalyticsService $service): JsonResponse
    {
        $this->authorize('viewAny', Geofence::class);

        $result = $service->paginated($request->user(), $request->validated());
        /** @var LengthAwarePaginator $paginator */
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
