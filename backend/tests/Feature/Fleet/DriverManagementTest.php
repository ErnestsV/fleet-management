<?php

namespace Tests\Feature\Fleet;

use App\Domain\Shared\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DriverManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_update_and_delete_driver(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        Sanctum::actingAs($admin);

        $create = $this->postJson('/api/v1/drivers', [
            'name' => 'John Driver',
            'email' => 'john@example.com',
            'phone' => '123456',
            'license_number' => 'LIC-100',
            'is_active' => true,
        ])->assertCreated();

        $driverId = $create->json('data.id') ?? $create->json('id');

        $this->patchJson("/api/v1/drivers/{$driverId}", [
            'name' => 'John Updated',
            'email' => 'john@example.com',
            'phone' => '123456',
            'license_number' => 'LIC-100',
            'is_active' => true,
        ])->assertOk();

        $this->deleteJson("/api/v1/drivers/{$driverId}")
            ->assertNoContent();
    }
}
