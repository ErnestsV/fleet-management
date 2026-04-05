<?php

namespace App\Http\Controllers\Api;

use App\Domain\Fleet\Models\Driver;
use App\Domain\Fleet\Services\DriverInsightsService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverInsightsController extends Controller
{
    public function __invoke(Request $request, DriverInsightsService $service): JsonResponse
    {
        $this->authorize('viewAny', Driver::class);

        return response()->json($service->summary($request->user()));
    }
}
