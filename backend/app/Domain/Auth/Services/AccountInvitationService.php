<?php

namespace App\Domain\Auth\Services;

use App\Models\User;
use App\Notifications\AccountInvitationNotification;
use Illuminate\Support\Facades\Password;
use Throwable;

class AccountInvitationService
{
    public function sendPasswordSetupLink(User $user): void
    {
        try {
            $token = Password::broker()->createToken($user);
            $user->notify(new AccountInvitationNotification($token));
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
