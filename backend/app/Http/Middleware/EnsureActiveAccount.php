<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveAccount
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        if (! $user->is_active) {
            $this->revokeCurrentToken($request);

            return response()->json([
                'message' => 'Account inactive.',
            ], Response::HTTP_FORBIDDEN);
        }

        if (! $user->isSuperAdmin() && ! $user->company?->is_active) {
            $this->revokeCurrentToken($request);

            return response()->json([
                'message' => 'Your company account is inactive. Contact your platform administrator.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }

    private function revokeCurrentToken(Request $request): void
    {
        $token = $request->user()?->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }
    }
}
