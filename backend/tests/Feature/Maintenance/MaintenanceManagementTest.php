<?php

namespace Tests\Feature\Maintenance;

use App\Domain\Companies\Models\Company;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Maintenance\Models\MaintenanceRecord;
use App\Domain\Maintenance\Models\MaintenanceSchedule;
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

    public function test_historical_record_does_not_move_schedule_due_fields_backwards(): void
    {
        $user = User::factory()->create(['role' => UserRole::Admin]);
        $vehicle = Vehicle::factory()->create(['company_id' => $user->company_id]);

        $schedule = MaintenanceSchedule::create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'name' => 'Oil change',
            'interval_days' => 90,
            'interval_km' => 10000,
            'next_due_date' => now()->addDays(30)->toDateString(),
            'next_due_odometer_km' => 180000,
            'is_active' => true,
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/maintenance-records', [
            'vehicle_id' => $vehicle->id,
            'maintenance_schedule_id' => $schedule->id,
            'title' => 'Backfilled service',
            'service_date' => now()->subDays(120)->toDateString(),
            'odometer_km' => 150000,
            'cost_amount' => 250,
            'currency' => 'EUR',
        ])->assertCreated();

        $schedule->refresh();

        $this->assertSame(now()->addDays(30)->toDateString(), $schedule->next_due_date?->toDateString());
        $this->assertSame(180000.0, $schedule->next_due_odometer_km);
    }

    public function test_super_admin_cannot_update_maintenance_records(): void
    {
        $superAdmin = User::factory()->superAdmin()->create();
        $companyA = Company::factory()->create();
        $companyB = Company::factory()->create();
        $vehicleA = Vehicle::factory()->create(['company_id' => $companyA->id]);
        $vehicleB = Vehicle::factory()->create(['company_id' => $companyB->id]);
        $scheduleA = MaintenanceSchedule::create([
            'company_id' => $companyA->id,
            'vehicle_id' => $vehicleA->id,
            'name' => 'Oil change',
            'interval_days' => 180,
            'interval_km' => 20000,
            'is_active' => true,
        ]);
        $record = MaintenanceRecord::create([
            'company_id' => $companyA->id,
            'vehicle_id' => $vehicleA->id,
            'maintenance_schedule_id' => $scheduleA->id,
            'title' => 'Service',
            'service_date' => now()->toDateString(),
            'odometer_km' => 100000,
            'cost_amount' => 100,
            'currency' => 'EUR',
        ]);

        Sanctum::actingAs($superAdmin);

        $this->patchJson("/api/v1/maintenance-records/{$record->id}", [
            'vehicle_id' => $vehicleB->id,
            'maintenance_schedule_id' => $scheduleA->id,
            'title' => 'Updated service',
            'service_date' => now()->toDateString(),
            'currency' => 'EUR',
        ])->assertForbidden();
    }

    public function test_super_admin_cannot_update_maintenance_schedules(): void
    {
        $superAdmin = User::factory()->superAdmin()->create();
        $companyA = Company::factory()->create();
        $companyB = Company::factory()->create();
        $vehicleA = Vehicle::factory()->create(['company_id' => $companyA->id]);
        $vehicleB = Vehicle::factory()->create(['company_id' => $companyB->id]);
        $schedule = MaintenanceSchedule::create([
            'company_id' => $companyA->id,
            'vehicle_id' => $vehicleA->id,
            'name' => 'Inspection',
            'interval_days' => 365,
            'interval_km' => 50000,
            'is_active' => true,
        ]);

        Sanctum::actingAs($superAdmin);

        $this->patchJson("/api/v1/maintenance-schedules/{$schedule->id}", [
            'vehicle_id' => $vehicleB->id,
            'name' => 'Inspection',
            'interval_days' => 365,
        ])->assertForbidden();
    }
}
