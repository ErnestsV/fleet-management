<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_dispatches_notification(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $this->postJson('/api/v1/auth/forgot-password', [
            'email' => $user->email,
        ])->assertOk()
            ->assertJson([
                'message' => 'If the account exists, a reset link has been sent.',
                'status' => 'accepted',
            ]);

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_forgot_password_returns_same_response_for_unknown_email(): void
    {
        Notification::fake();

        $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'missing@example.test',
        ])->assertOk()
            ->assertJson([
                'message' => 'If the account exists, a reset link has been sent.',
                'status' => 'accepted',
            ]);

        Notification::assertNothingSent();
    }

    public function test_reset_password_revokes_existing_api_tokens(): void
    {
        $user = User::factory()->create(['password' => 'password']);
        $user->createToken('web');
        $user->createToken('web');

        $token = Password::broker()->createToken($user);

        $this->postJson('/api/v1/auth/reset-password', [
            'email' => $user->email,
            'token' => $token,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
