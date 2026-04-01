<?php

namespace Tests\Feature\Profile;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_update_profile_and_password(): void
    {
        $user = User::factory()->create(['password' => 'password']);
        Sanctum::actingAs($user);

        $this->patchJson('/api/v1/auth/profile', [
            'name' => 'Updated Name',
            'email' => $user->email,
            'timezone' => 'UTC',
        ])->assertOk();

        $this->postJson('/api/v1/auth/change-password', [
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertOk();

        $this->assertTrue(Hash::check('new-password', $user->fresh()->password));
    }
}
