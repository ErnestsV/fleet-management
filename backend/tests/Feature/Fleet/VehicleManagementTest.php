<?php

namespace Tests\Feature\Fleet;

use App\Domain\Shared\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VehicleManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_update_and_delete_vehicle(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        Sanctum::actingAs($admin);

        $create = $this->postJson('/api/v1/vehicles', [
            'name' => 'Main Van',
            'plate_number' => 'AB-1234',
            'make' => 'Volvo',
            'model' => 'FH',
            'year' => 2024,
            'is_active' => true,
        ])->assertCreated();

        $vehicleId = $create->json('data.id') ?? $create->json('id');

        $this->patchJson("/api/v1/vehicles/{$vehicleId}", [
            'name' => 'Main Van Updated',
            'plate_number' => 'AB-1234',
            'make' => 'Volvo',
            'model' => 'FH Aero',
            'year' => 2025,
            'is_active' => true,
        ])->assertOk();

        $this->deleteJson("/api/v1/vehicles/{$vehicleId}")
            ->assertNoContent();
    }
}
