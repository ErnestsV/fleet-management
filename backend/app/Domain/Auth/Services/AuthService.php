<?php

namespace App\Domain\Auth\Services;

use App\Domain\Auth\Data\LoginResult;
use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function login(array $credentials): LoginResult
    {
        if (! Auth::guard('web')->attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        /** @var User $user */
        $user = Auth::guard('web')->user();

        if (! $user->is_active) {
            Auth::logout();
            throw new AuthenticationException('Account inactive.');
        }

        if (! $user->isSuperAdmin() && ! $user->company?->is_active) {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => ['Your company account is inactive. Contact your platform administrator.'],
            ]);
        }

        $token = $user->createToken('web')->plainTextToken;

        return new LoginResult($user, $token);
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();
    }
}
