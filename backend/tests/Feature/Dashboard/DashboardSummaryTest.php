<?php

namespace Tests\Feature\Dashboard;

use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Telemetry\Models\TelemetryEvent;
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

    public function test_dashboard_summary_returns_null_fuel_metrics_when_day_has_insufficient_telemetry_samples(): void
    {
        $user = User::factory()->create();
        $vehicle = Vehicle::factory()->create(['company_id' => $user->company_id]);

        TelemetryEvent::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'occurred_at' => now()->subDay()->setTime(9, 0),
            'latitude' => 56.9496,
            'longitude' => 24.1052,
            'odometer_km' => 15000,
            'fuel_level' => 76,
            'speed_kmh' => 0,
            'engine_on' => false,
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('fuel.estimated_fuel_used_yesterday_l', null)
            ->assertJsonPath('fuel.estimated_avg_consumption_yesterday_l_per_100km', null)
            ->assertJsonPath('fuel.average_fuel_level_yesterday_pct', null);
    }
}
