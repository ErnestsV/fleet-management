<?php

namespace Tests\Feature\Drivers;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Alerts\Models\Alert;
use App\Domain\Fleet\Models\Driver;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Fleet\Models\VehicleDriverAssignment;
use App\Domain\Trips\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DriverInsightsTest extends TestCase
{
    use RefreshDatabase;

    public function test_driver_insights_returns_assignment_attributed_metrics(): void
    {
        $user = User::factory()->create();
        $vehicle = Vehicle::factory()->create(['company_id' => $user->company_id]);
        $driverA = Driver::factory()->create(['company_id' => $user->company_id, 'name' => 'Driver A']);
        $driverB = Driver::factory()->create(['company_id' => $user->company_id, 'name' => 'Driver B']);

        VehicleDriverAssignment::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driverA->id,
            'assigned_from' => now()->subDays(6)->startOfDay(),
            'assigned_until' => now()->subDays(3)->startOfDay(),
        ]);

        VehicleDriverAssignment::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driverB->id,
            'assigned_from' => now()->subDays(3)->startOfDay(),
            'assigned_until' => null,
        ]);

        Trip::factory()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'start_time' => now()->subDays(5)->setTime(9, 0),
            'end_time' => now()->subDays(5)->setTime(9, 45),
            'distance_km' => 22,
            'duration_seconds' => 2700,
        ]);

        Trip::factory()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'start_time' => now()->subDays(1)->setTime(10, 0),
            'end_time' => now()->subDays(1)->setTime(10, 20),
            'distance_km' => 6,
            'duration_seconds' => 1200,
        ]);

        Alert::factory()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'type' => AlertType::Speeding,
            'triggered_at' => now()->subDays(1)->setTime(10, 10),
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/driver-insights')
            ->assertOk()
            ->assertJsonStructure([
                'window',
                'headline',
                'leaderboards' => ['top_drivers', 'needs_coaching', 'most_improved'],
                'drivers',
            ]);

        $drivers = collect($response->json('drivers'))->keyBy('driver_id');

        $this->assertSame(1, $drivers[$driverA->id]['trip_count']);
        $this->assertSame(22.0, (float) $drivers[$driverA->id]['distance_km']);
        $this->assertSame(45.0, (float) $drivers[$driverA->id]['avg_trip_duration_minutes']);
        $this->assertSame(0.8, (float) $drivers[$driverA->id]['total_drive_hours']);
        $this->assertSame(0, $drivers[$driverA->id]['speeding_alerts']);

        $this->assertSame(1, $drivers[$driverB->id]['trip_count']);
        $this->assertSame(6.0, (float) $drivers[$driverB->id]['distance_km']);
        $this->assertSame(20.0, (float) $drivers[$driverB->id]['avg_trip_duration_minutes']);
        $this->assertSame(0.3, (float) $drivers[$driverB->id]['total_drive_hours']);
        $this->assertSame(1, $drivers[$driverB->id]['speeding_alerts']);
        $this->assertNotNull($drivers[$driverA->id]['score']);
        $this->assertNotNull($drivers[$driverB->id]['score']);
    }
}
