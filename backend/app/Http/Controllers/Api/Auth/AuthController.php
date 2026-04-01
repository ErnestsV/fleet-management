<?php

namespace App\Http\Controllers\Api\Auth;

use App\Domain\Auth\Services\AuthService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function login(LoginRequest $request, AuthService $service): JsonResponse
    {
        [$user, $token] = $service->login($request->validated());

        return response()->json([
            'token' => $token,
            'user' => new UserResource($user),
        ]);
    }

    public function logout(Request $request, AuthService $service): JsonResponse
    {
        $service->logout($request->user());

        return response()->json(['message' => 'Logged out.']);
    }
}
