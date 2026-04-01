<?php

namespace Tests\Feature\Maintenance;

use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Shared\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MaintenanceManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_schedule_and_record(): void
    {
        $user = User::factory()->create(['role' => UserRole::Admin]);
        $vehicle = Vehicle::factory()->create(['company_id' => $user->company_id]);

        Sanctum::actingAs($user);

        $schedule = $this->postJson('/api/v1/maintenance-schedules', [
            'vehicle_id' => $vehicle->id,
            'name' => 'Oil change',
            'interval_days' => 180,
            'interval_km' => 20000,
            'is_active' => true,
        ])->assertCreated();

        $scheduleId = $schedule->json('data.id') ?? $schedule->json('id');

        $this->postJson('/api/v1/maintenance-records', [
            'vehicle_id' => $vehicle->id,
            'maintenance_schedule_id' => $scheduleId,
            'title' => 'Completed oil change',
            'service_date' => now()->toDateString(),
            'odometer_km' => 100000,
            'cost_amount' => 250,
            'currency' => 'EUR',
        ])->assertCreated();

        $this->getJson('/api/v1/maintenance-upcoming')
            ->assertOk();
    }
}
