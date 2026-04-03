<?php

namespace Tests\Feature\Trips;

use App\Domain\Companies\Models\Company;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Telemetry\Models\DeviceToken;
use App\Domain\Trips\Models\Trip;
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

    public function test_out_of_order_event_does_not_mutate_existing_trip_history(): void
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
            'timestamp' => '2026-04-02T15:00:00Z',
            'latitude' => 56.95,
            'longitude' => 24.10,
            'speed_kmh' => 50,
            'engine_on' => true,
            'odometer_km' => 1000,
        ])->assertStatus(202);

        $this->withHeader('Authorization', 'Bearer '.$plainToken)->postJson('/api/v1/telemetry/events', [
            'vehicle_id' => $vehicle->id,
            'timestamp' => '2026-04-02T15:20:00Z',
            'latitude' => 56.99,
            'longitude' => 24.20,
            'speed_kmh' => 0,
            'engine_on' => false,
            'odometer_km' => 1012,
        ])->assertStatus(202);

        $this->withHeader('Authorization', 'Bearer '.$plainToken)->postJson('/api/v1/telemetry/events', [
            'vehicle_id' => $vehicle->id,
            'timestamp' => '2026-04-01T21:00:00Z',
            'latitude' => 56.90,
            'longitude' => 24.05,
            'speed_kmh' => 0,
            'engine_on' => false,
            'odometer_km' => 990,
        ])->assertStatus(202);

        $trip = Trip::query()->where('vehicle_id', $vehicle->id)->sole();

        $this->assertSame('2026-04-02 15:00:00', $trip->start_time?->utc()->format('Y-m-d H:i:s'));
        $this->assertSame('2026-04-02 15:20:00', $trip->end_time?->utc()->format('Y-m-d H:i:s'));
        $this->assertSame(1200, $trip->duration_seconds);
        $this->assertSame(12.0, $trip->distance_km);
    }
}
