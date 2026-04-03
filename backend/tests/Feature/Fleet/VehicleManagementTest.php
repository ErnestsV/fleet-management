<?php

namespace Tests\Feature\Fleet;

use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Telemetry\Models\DeviceToken;
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
        ])->assertCreated()
            ->assertJsonPath('data.device_token.is_active', true)
            ->assertJson(fn ($json) => $json->whereType('provisioning_token', 'string')->etc());

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

    public function test_admin_can_recreate_vehicle_with_same_plate_after_soft_delete(): void
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

        $this->deleteJson("/api/v1/vehicles/{$vehicleId}")
            ->assertNoContent();

        $this->postJson('/api/v1/vehicles', [
            'name' => 'Replacement Van',
            'plate_number' => 'AB-1234',
            'make' => 'Volvo',
            'model' => 'FH Aero',
            'year' => 2025,
            'is_active' => true,
        ])->assertCreated();
    }

    public function test_admin_can_rotate_vehicle_device_token(): void
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
        $firstToken = $create->json('provisioning_token');

        $rotate = $this->postJson("/api/v1/vehicles/{$vehicleId}/device-token/rotate")
            ->assertOk()
            ->assertJsonPath('data.device_token.is_active', true)
            ->assertJson(fn ($json) => $json->whereType('provisioning_token', 'string')->etc());

        $this->assertNotSame($firstToken, $rotate->json('provisioning_token'));

        $vehicle = Vehicle::query()->findOrFail($vehicleId);
        $newToken = (string) $rotate->json('provisioning_token');

        $this->assertDatabaseHas('device_tokens', [
            'vehicle_id' => $vehicle->id,
            'token' => hash('sha256', $newToken),
            'is_active' => true,
        ]);

        $this->assertSame(
            1,
            DeviceToken::query()->where('vehicle_id', $vehicle->id)->where('is_active', true)->count()
        );

        $this->withHeader('Authorization', 'Bearer '.(string) $firstToken)
            ->postJson('/api/v1/telemetry/events', [
                'vehicle_id' => $vehicle->id,
                'timestamp' => now()->toIso8601String(),
                'latitude' => 56.95,
                'longitude' => 24.10,
                'speed_kmh' => 55,
                'engine_on' => true,
            ])
            ->assertStatus(422);

        $this->withHeader('Authorization', 'Bearer '.$newToken)
            ->postJson('/api/v1/telemetry/events', [
                'vehicle_id' => $vehicle->id,
                'timestamp' => now()->addSecond()->toIso8601String(),
                'latitude' => 56.95,
                'longitude' => 24.10,
                'speed_kmh' => 55,
                'engine_on' => true,
            ])
            ->assertStatus(202);
    }
}
