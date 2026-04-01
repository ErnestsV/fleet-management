<?php

namespace Tests\Feature\Users;

use App\Domain\Companies\Models\Company;
use App\Domain\Shared\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TenancyScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_company_admin_only_sees_users_from_own_company(): void
    {
        $companyA = Company::factory()->create();
        $companyB = Company::factory()->create();

        $admin = User::factory()->create(['company_id' => $companyA->id, 'role' => UserRole::Admin]);
        $ownUser = User::factory()->create(['company_id' => $companyA->id]);
        $otherUser = User::factory()->create(['company_id' => $companyB->id]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/users');

        $response->assertOk();
        $response->assertJsonFragment(['id' => $ownUser->id]);
        $response->assertJsonMissing(['id' => $otherUser->id]);
    }
}
