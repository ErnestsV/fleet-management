<?php

namespace App\Http\Controllers\Api;

use App\Domain\Ai\Services\AiCopilotService;
use App\Http\Controllers\Controller;
use App\Http\Requests\AiCopilotMessageRequest;
use Illuminate\Http\JsonResponse;

class AiCopilotController extends Controller
{
    public function __invoke(AiCopilotMessageRequest $request, AiCopilotService $service): JsonResponse
    {
        return response()->json($service->respond(
            user: $request->user(),
            message: $request->validated('message'),
            history: $request->validated('history', []),
        ));
    }
}
