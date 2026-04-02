<?php

namespace Tests\Feature\Auth;

use App\Domain\Companies\Models\Company;
use App\Domain\Shared\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InactiveCompanyAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_company_user_cannot_log_in_when_company_is_inactive(): void
    {
        $company = Company::factory()->create(['is_active' => false]);
        $user = User::factory()->for($company)->create([
            'role' => UserRole::Owner,
            'password' => 'password',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_company_user_with_existing_token_is_blocked_when_company_is_inactive(): void
    {
        $company = Company::factory()->create(['is_active' => false]);
        $user = User::factory()->for($company)->create([
            'role' => UserRole::Owner,
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/auth/user')
            ->assertForbidden()
            ->assertJson([
                'message' => 'Your company account is inactive. Contact your platform administrator.',
            ]);
    }
}
