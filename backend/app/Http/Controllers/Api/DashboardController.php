<?php

namespace App\Http\Controllers\Api;

use App\Domain\Fleet\Services\DashboardService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request, DashboardService $service): JsonResponse
    {
        return response()->json($service->summary($request->user()));
    }
}
