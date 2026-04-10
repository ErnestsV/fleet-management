<?php

namespace App\Http\Controllers\Api;

use App\Domain\Platform\Services\PlatformOperationsReadService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class PlatformFailedJobsController extends Controller
{
    public function __invoke(Request $request, PlatformOperationsReadService $service): JsonResponse
    {
        if (! $request->user()?->isSuperAdmin()) {
            throw new HttpException(403, 'This account cannot access platform operations.');
        }

        $validated = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        return response()->json($service->failedJobsPaginated((int) ($validated['per_page'] ?? 10)));
    }
}
