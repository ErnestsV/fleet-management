<?php

namespace Tests\Feature\Dashboard;

use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Telemetry\Enums\VehicleStatus;
use App\Domain\Telemetry\Models\VehicleState;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardSummaryTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_summary_returns_extended_payload(): void
    {
        $user = User::factory()->create();
        $vehicle = Vehicle::factory()->create(['company_id' => $user->company_id]);
        VehicleState::create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'status' => VehicleStatus::Moving,
            'last_event_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/dashboard/summary')
            ->assertOk()
            ->assertJsonStructure([
                'total_vehicles',
                'moving_vehicles',
                'alerts_by_type',
                'distance_by_vehicle',
                'trips_over_time',
                'fleet',
            ]);
    }
}
