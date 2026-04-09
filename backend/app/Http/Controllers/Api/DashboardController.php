<?php

namespace App\Http\Controllers\Api;

use App\Domain\Fleet\Services\DashboardService;
use Symfony\Component\HttpKernel\Exception\HttpException;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request, DashboardService $service): JsonResponse
    {
        if (! ($request->user()->role?->canAccessFleetData() ?? false)) {
            throw new HttpException(403, 'This account cannot access fleet operations.');
        }

        return response()->json($service->summary($request->user()));
    }
}
