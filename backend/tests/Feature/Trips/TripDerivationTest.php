<?php

namespace Tests\Feature\Trips;

use App\Domain\Companies\Models\Company;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Telemetry\Models\DeviceToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TripDerivationTest extends TestCase
{
    use RefreshDatabase;

    public function test_moving_then_stopped_events_create_closed_trip(): void
    {
        $company = Company::factory()->create();
        $vehicle = Vehicle::factory()->create(['company_id' => $company->id]);
        $plainToken = 'trip-token';

        DeviceToken::create([
            'company_id' => $company->id,
            'vehicle_id' => $vehicle->id,
            'name' => 'Trip token',
            'token' => hash('sha256', $plainToken),
            'is_active' => true,
        ]);

        $this->withHeader('Authorization', 'Bearer '.$plainToken)->postJson('/api/v1/telemetry/events', [
            'vehicle_id' => $vehicle->id,
            'timestamp' => now()->subMinutes(10)->toIso8601String(),
            'latitude' => 56.95,
            'longitude' => 24.10,
            'speed_kmh' => 50,
            'engine_on' => true,
            'odometer_km' => 1000,
        ])->assertStatus(202);

        $this->withHeader('Authorization', 'Bearer '.$plainToken)->postJson('/api/v1/telemetry/events', [
            'vehicle_id' => $vehicle->id,
            'timestamp' => now()->toIso8601String(),
            'latitude' => 56.99,
            'longitude' => 24.20,
            'speed_kmh' => 0,
            'engine_on' => false,
            'odometer_km' => 1012,
        ])->assertStatus(202);

        $this->assertDatabaseHas('trips', [
            'vehicle_id' => $vehicle->id,
            'distance_km' => 12,
        ]);
    }
}
