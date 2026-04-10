<?php

namespace App\Http\Controllers\Api;

use App\Domain\Platform\Services\PlatformOperationsReadService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class PlatformOperationsController extends Controller
{
    public function __invoke(Request $request, PlatformOperationsReadService $service): JsonResponse
    {
        if (! $request->user()?->isSuperAdmin()) {
            throw new HttpException(403, 'This account cannot access platform operations.');
        }

        return response()->json([
            'data' => $service->summary(),
        ]);
    }
}
