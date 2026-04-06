<?php

namespace Tests\Feature\Fleet;

use App\Domain\Companies\Models\Company;
use App\Domain\Fleet\Models\Driver;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Shared\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VehicleDriverAssignmentManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_assignment_creation_and_end_preserve_history(): void
    {
        $user = User::factory()->create(['role' => UserRole::Dispatcher]);
        $vehicle = Vehicle::factory()->create(['company_id' => $user->company_id]);
        $driver = Driver::factory()->create(['company_id' => $user->company_id]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/vehicle-driver-assignments', [
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'assigned_from' => now()->subHour()->toIso8601String(),
        ])->assertCreated();

        $assignmentId = $response->json('data.id') ?? $response->json('id');

        $this->postJson("/api/v1/vehicle-driver-assignments/{$assignmentId}/end", [
            'assigned_until' => now()->toIso8601String(),
        ])->assertOk();
    }

    public function test_assignment_creation_rejects_cross_company_pairs(): void
    {
        $user = User::factory()->superAdmin()->create(['role' => UserRole::SuperAdmin, 'company_id' => null]);
        $vehicle = Vehicle::factory()->create();
        $driver = Driver::factory()->create(['company_id' => Company::factory()->create()->id]);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/vehicle-driver-assignments', [
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'assigned_from' => now()->subHour()->toIso8601String(),
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['driver_id']);
    }

    public function test_company_dispatcher_cannot_assign_vehicle_or_driver_from_other_company(): void
    {
        $ownCompany = Company::factory()->create();
        $otherCompany = Company::factory()->create();
        $user = User::factory()->create([
            'role' => UserRole::Dispatcher,
            'company_id' => $ownCompany->id,
        ]);
        $vehicle = Vehicle::factory()->create(['company_id' => $otherCompany->id]);
        $driver = Driver::factory()->create(['company_id' => $otherCompany->id]);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/vehicle-driver-assignments', [
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'assigned_from' => now()->subHour()->toIso8601String(),
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['vehicle_id', 'driver_id']);
    }
}
