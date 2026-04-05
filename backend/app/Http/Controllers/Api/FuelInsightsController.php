<?php

namespace App\Http\Controllers\Api;

use App\Domain\Alerts\Models\Alert;
use App\Domain\Fleet\Services\FuelInsightsService;
use App\Http\Controllers\Controller;
use App\Http\Requests\FuelInsightsIndexRequest;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;

class FuelInsightsController extends Controller
{
    public function __invoke(FuelInsightsIndexRequest $request, FuelInsightsService $service): JsonResponse
    {
        $this->authorize('viewAny', Alert::class);

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
