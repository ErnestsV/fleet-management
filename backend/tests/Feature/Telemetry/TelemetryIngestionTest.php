<?php

namespace Tests\Feature\Telemetry;

use App\Domain\Companies\Models\Company;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Telemetry\Models\DeviceToken;
use App\Domain\Telemetry\Models\TelemetryEvent;
use App\Domain\Telemetry\Models\VehicleState;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TelemetryIngestionTest extends TestCase
{
    use RefreshDatabase;

    public function test_telemetry_ingest_validates_and_updates_vehicle_state(): void
    {
        $company = Company::factory()->create();
        $vehicle = Vehicle::factory()->create(['company_id' => $company->id]);
        $plainToken = 'demo-token';

        DeviceToken::create([
            'company_id' => $company->id,
            'vehicle_id' => $vehicle->id,
            'name' => 'Test',
            'token' => hash('sha256', $plainToken),
            'is_active' => true,
        ]);

        $this->withHeader('Authorization', 'Bearer '.$plainToken)
            ->postJson('/api/v1/telemetry/events', [
                'vehicle_id' => $vehicle->id,
                'timestamp' => now()->toIso8601String(),
                'latitude' => 56.95,
                'longitude' => 24.10,
                'speed_kmh' => 55,
                'engine_on' => true,
            ])
            ->assertStatus(202);

        $this->assertDatabaseCount('telemetry_events', 1);
        $this->assertDatabaseHas('vehicle_states', [
            'vehicle_id' => $vehicle->id,
            'status' => 'moving',
        ]);
    }

    public function test_invalid_token_is_rejected(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer invalid')
            ->postJson('/api/v1/telemetry/events', [
                'timestamp' => now()->toIso8601String(),
                'latitude' => 56.95,
                'longitude' => 24.10,
                'speed_kmh' => 55,
                'engine_on' => true,
            ]);

        $response->assertStatus(422);
    }
}
