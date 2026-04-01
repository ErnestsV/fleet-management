<?php

namespace Tests\Feature\Maintenance;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Alerts\Models\Alert;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Maintenance\Models\MaintenanceSchedule;
use App\Domain\Shared\Enums\UserRole;
use App\Domain\Telemetry\Models\VehicleState;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MaintenanceAlertTest extends TestCase
{
    use RefreshDatabase;

    public function test_due_schedule_creates_maintenance_alert_via_scheduled_command(): void
    {
        $user = User::factory()->create(['role' => UserRole::Admin]);
        $vehicle = Vehicle::factory()->create(['company_id' => $user->company_id]);

        VehicleState::create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'status' => 'stopped',
            'last_event_at' => now(),
            'odometer_km' => 150000,
        ]);

        MaintenanceSchedule::create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'name' => 'Oil Change',
            'interval_days' => 90,
            'interval_km' => 15000,
            'next_due_date' => now()->subDay()->toDateString(),
            'next_due_odometer_km' => 160000,
            'is_active' => true,
        ]);

        $this->artisan('app:check-maintenance-schedules')->assertSuccessful();

        $this->assertDatabaseHas('alerts', [
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'type' => AlertType::MaintenanceDue->value,
            'resolved_at' => null,
        ]);
    }

    public function test_creating_linked_maintenance_record_advances_schedule_and_resolves_due_alert(): void
    {
        $user = User::factory()->create(['role' => UserRole::Admin]);
        $vehicle = Vehicle::factory()->create(['company_id' => $user->company_id]);

        $schedule = MaintenanceSchedule::create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'name' => 'Oil Change',
            'interval_days' => 90,
            'interval_km' => 10000,
            'next_due_date' => now()->subDay()->toDateString(),
            'next_due_odometer_km' => 150050,
            'is_active' => true,
        ]);

        Alert::create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'type' => AlertType::MaintenanceDue,
            'severity' => 'high',
            'message' => 'Maintenance schedule is due.',
            'triggered_at' => now(),
            'context' => ['maintenance_schedule_id' => $schedule->id],
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/maintenance-records', [
            'vehicle_id' => $vehicle->id,
            'maintenance_schedule_id' => $schedule->id,
            'title' => 'Completed oil change',
            'service_date' => now()->toDateString(),
            'odometer_km' => 152000,
            'cost_amount' => 250,
            'currency' => 'EUR',
        ])->assertCreated();

        $schedule->refresh();

        $this->assertSame(now()->addDays(90)->toDateString(), $schedule->next_due_date?->toDateString());
        $this->assertSame(162000.0, $schedule->next_due_odometer_km);

        $this->assertDatabaseMissing('alerts', [
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'type' => AlertType::MaintenanceDue->value,
            'resolved_at' => null,
        ]);
    }
}
