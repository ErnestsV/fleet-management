<?php

namespace Tests\Feature\Telemetry;

use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Telemetry\Enums\VehicleStatus;
use App\Domain\Telemetry\Models\TelemetryEvent;
use App\Domain\Telemetry\Models\VehicleState;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TelemetryHealthTest extends TestCase
{
    use RefreshDatabase;

    public function test_telemetry_health_endpoint_returns_summary_and_ranked_rows(): void
    {
        $user = User::factory()->create();

        $healthyVehicle = Vehicle::factory()->create([
            'company_id' => $user->company_id,
            'plate_number' => 'HEALTHY-1',
        ]);
        $staleVehicle = Vehicle::factory()->create([
            'company_id' => $user->company_id,
            'plate_number' => 'STALE-1',
        ]);
        $offlineVehicle = Vehicle::factory()->create([
            'company_id' => $user->company_id,
            'plate_number' => 'OFFLINE-1',
        ]);
        $missingFieldsVehicle = Vehicle::factory()->create([
            'company_id' => $user->company_id,
            'plate_number' => 'MISSING-1',
        ]);
        $lowFrequencyVehicle = Vehicle::factory()->create([
            'company_id' => $user->company_id,
            'plate_number' => 'LOWFREQ-1',
        ]);
        $noDataVehicle = Vehicle::factory()->create([
            'company_id' => $user->company_id,
            'plate_number' => 'NODATA-1',
        ]);

        VehicleState::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $healthyVehicle->id,
            'status' => VehicleStatus::Moving,
            'last_event_at' => now()->subMinutes(5),
            'latitude' => 56.9496,
            'longitude' => 24.1052,
            'odometer_km' => 50000,
            'fuel_level' => 75,
        ]);

        VehicleState::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $staleVehicle->id,
            'status' => VehicleStatus::Stopped,
            'last_event_at' => now()->subHours(2),
            'latitude' => 56.9496,
            'longitude' => 24.1052,
            'odometer_km' => 40000,
            'fuel_level' => 60,
        ]);

        VehicleState::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $offlineVehicle->id,
            'status' => VehicleStatus::Offline,
            'last_event_at' => now()->subHours(30),
            'latitude' => 56.9496,
            'longitude' => 24.1052,
            'odometer_km' => 30000,
            'fuel_level' => 50,
        ]);

        VehicleState::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $missingFieldsVehicle->id,
            'status' => VehicleStatus::Moving,
            'last_event_at' => now()->subMinutes(8),
            'latitude' => 56.9496,
            'longitude' => 24.1052,
            'odometer_km' => null,
            'fuel_level' => null,
        ]);

        VehicleState::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $lowFrequencyVehicle->id,
            'status' => VehicleStatus::Idling,
            'last_event_at' => now()->subMinutes(10),
            'latitude' => 56.9496,
            'longitude' => 24.1052,
            'odometer_km' => 20000,
            'fuel_level' => 40,
        ]);

        foreach (range(1, 15) as $index) {
            TelemetryEvent::query()->create([
                'company_id' => $user->company_id,
                'vehicle_id' => $healthyVehicle->id,
                'occurred_at' => now()->subMinutes($index),
                'latitude' => 56.9496,
                'longitude' => 24.1052,
                'speed_kmh' => 30,
                'engine_on' => true,
                'odometer_km' => 50000 + $index,
                'fuel_level' => 75,
            ]);
        }

        foreach (range(1, 2) as $index) {
            TelemetryEvent::query()->create([
                'company_id' => $user->company_id,
                'vehicle_id' => $lowFrequencyVehicle->id,
                'occurred_at' => now()->subHours($index),
                'latitude' => 56.9496,
                'longitude' => 24.1052,
                'speed_kmh' => 0,
                'engine_on' => true,
                'odometer_km' => 20000,
                'fuel_level' => 40,
            ]);
        }

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/telemetry-health')
            ->assertOk()
            ->assertJsonPath('summary.total_devices', 6)
            ->assertJsonPath('summary.healthy_count', 1)
            ->assertJsonPath('summary.stale_count', 1)
            ->assertJsonPath('summary.offline_over_24h_count', 1)
            ->assertJsonPath('summary.no_data_count', 1)
            ->assertJsonPath('summary.low_frequency_count', 1)
            ->assertJsonPath('summary.missing_fields_count', 1)
            ->assertJsonPath('data.0.plate_number', 'NODATA-1')
            ->assertJsonPath('data.0.health_status', 'no_data');
    }

    public function test_telemetry_health_endpoint_supports_filters(): void
    {
        $user = User::factory()->create();

        $offlineVehicle = Vehicle::factory()->create([
            'company_id' => $user->company_id,
            'plate_number' => 'OFFLINE-2',
        ]);
        $healthyVehicle = Vehicle::factory()->create([
            'company_id' => $user->company_id,
            'plate_number' => 'HEALTHY-2',
        ]);

        VehicleState::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $offlineVehicle->id,
            'status' => VehicleStatus::Offline,
            'last_event_at' => now()->subHours(25),
            'latitude' => 56.9496,
            'longitude' => 24.1052,
            'odometer_km' => 1000,
            'fuel_level' => 30,
        ]);

        VehicleState::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $healthyVehicle->id,
            'status' => VehicleStatus::Moving,
            'last_event_at' => now()->subMinutes(5),
            'latitude' => 56.9496,
            'longitude' => 24.1052,
            'odometer_km' => 1000,
            'fuel_level' => 30,
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/telemetry-health?health_status=offline&search=OFFLINE')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.plate_number', 'OFFLINE-2')
            ->assertJsonPath('data.0.freshness_bucket', 'offline');
    }
}
