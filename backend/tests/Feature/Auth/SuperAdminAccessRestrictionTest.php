<?php

namespace Tests\Feature\Auth;

use App\Domain\Companies\Models\Company;
use App\Domain\Shared\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SuperAdminAccessRestrictionTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_cannot_access_dashboard_summary(): void
    {
        $superAdmin = User::factory()->superAdmin()->create([
            'role' => UserRole::SuperAdmin,
            'company_id' => null,
        ]);

        Sanctum::actingAs($superAdmin);

        $this->getJson('/api/v1/dashboard/summary')
            ->assertForbidden();
    }

    public function test_super_admin_cannot_list_company_users(): void
    {
        $superAdmin = User::factory()->superAdmin()->create([
            'role' => UserRole::SuperAdmin,
            'company_id' => null,
        ]);
        $company = Company::factory()->create();
        User::factory()->create([
            'company_id' => $company->id,
            'role' => UserRole::Owner,
        ]);

        Sanctum::actingAs($superAdmin);

        $this->getJson('/api/v1/users')
            ->assertForbidden();
    }

    public function test_super_admin_cannot_list_vehicles(): void
    {
        $superAdmin = User::factory()->superAdmin()->create([
            'role' => UserRole::SuperAdmin,
            'company_id' => null,
        ]);

        Sanctum::actingAs($superAdmin);

        $this->getJson('/api/v1/vehicles')
            ->assertForbidden();
    }
}
