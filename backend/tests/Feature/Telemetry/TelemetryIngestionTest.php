<?php

namespace Tests\Feature\Telemetry;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Alerts\Models\Alert;
use App\Domain\Companies\Models\Company;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Geofences\Models\Geofence;
use App\Domain\Telemetry\Models\DeviceToken;
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

        $response = $this->withHeader('Authorization', 'Bearer '.$plainToken)
            ->postJson('/api/v1/telemetry/events', [
                'vehicle_id' => $vehicle->id,
                'timestamp' => now()->toIso8601String(),
                'latitude' => 56.95,
                'longitude' => 24.10,
                'speed_kmh' => 55,
                'engine_on' => true,
            ])
            ->assertStatus(202);

        $response->assertJsonPath('duplicate', false);
        $this->assertDatabaseCount('telemetry_events', 1);
        $this->assertDatabaseHas('vehicle_states', [
            'vehicle_id' => $vehicle->id,
            'status' => 'moving',
        ]);
        $this->assertDatabaseMissing('telemetry_events', [
            'vehicle_id' => $vehicle->id,
            'processed_at' => null,
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

    public function test_stale_telemetry_event_is_stored_without_mutating_state_or_geofence_alerts(): void
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

        $geofence = Geofence::query()->create([
            'company_id' => $company->id,
            'name' => 'Riga Depot',
            'type' => 'circle',
            'geometry' => [
                'center' => ['lat' => 56.9496, 'lng' => 24.1052],
                'radius_m' => 500,
            ],
            'is_active' => true,
        ]);

        VehicleState::query()->create([
            'company_id' => $company->id,
            'vehicle_id' => $vehicle->id,
            'status' => 'moving',
            'last_event_at' => '2026-04-03T12:00:00Z',
            'latitude' => 56.9496,
            'longitude' => 24.1052,
            'speed_kmh' => 45,
            'engine_on' => true,
            'last_geofence_ids' => [$geofence->id],
        ]);

        $this->withHeader('Authorization', 'Bearer '.$plainToken)
            ->postJson('/api/v1/telemetry/events', [
                'vehicle_id' => $vehicle->id,
                'timestamp' => '2026-04-03T11:00:00Z',
                'latitude' => 56.9300,
                'longitude' => 24.0700,
                'speed_kmh' => 20,
                'engine_on' => true,
            ])
            ->assertStatus(202);

        $this->assertDatabaseCount('telemetry_events', 1);

        $state = VehicleState::query()->where('vehicle_id', $vehicle->id)->firstOrFail();

        $this->assertSame('2026-04-03 12:00:00', $state->last_event_at?->clone()->utc()->format('Y-m-d H:i:s'));
        $this->assertSame([$geofence->id], $state->last_geofence_ids);

        $this->assertDatabaseMissing('alerts', [
            'vehicle_id' => $vehicle->id,
            'type' => AlertType::GeofenceEntry->value,
        ]);
        $this->assertDatabaseMissing('alerts', [
            'vehicle_id' => $vehicle->id,
            'type' => AlertType::GeofenceExit->value,
        ]);
    }

    public function test_duplicate_message_id_is_deduplicated(): void
    {
        $company = Company::factory()->create();
        $vehicle = Vehicle::factory()->create(['company_id' => $company->id]);
        $plainToken = 'dedupe-token';

        DeviceToken::create([
            'company_id' => $company->id,
            'vehicle_id' => $vehicle->id,
            'name' => 'Test',
            'token' => hash('sha256', $plainToken),
            'is_active' => true,
        ]);

        $payload = [
            'message_id' => 'device-event-0001',
            'timestamp' => now()->startOfMinute()->toIso8601String(),
            'latitude' => 56.95,
            'longitude' => 24.10,
            'speed_kmh' => 42,
            'engine_on' => true,
        ];

        $firstResponse = $this->withHeader('Authorization', 'Bearer '.$plainToken)
            ->postJson('/api/v1/telemetry/events', $payload)
            ->assertStatus(202);

        $secondResponse = $this->withHeader('Authorization', 'Bearer '.$plainToken)
            ->postJson('/api/v1/telemetry/events', $payload)
            ->assertStatus(202);

        $firstResponse->assertJsonPath('duplicate', false);
        $secondResponse->assertJsonPath('duplicate', true);
        $secondResponse->assertJsonPath('event_id', $firstResponse->json('event_id'));

        $this->assertDatabaseCount('telemetry_events', 1);
        $this->assertDatabaseHas('telemetry_events', [
            'vehicle_id' => $vehicle->id,
            'message_id' => 'device-event-0001',
        ]);
    }
}
