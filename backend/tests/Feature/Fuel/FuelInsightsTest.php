<?php

namespace Tests\Feature\Fuel;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Alerts\Models\Alert;
use App\Domain\Alerts\Services\AlertEvaluationService;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Telemetry\Enums\VehicleStatus;
use App\Domain\Telemetry\Models\TelemetryEvent;
use App\Domain\Telemetry\Models\VehicleState;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FuelInsightsTest extends TestCase
{
    use RefreshDatabase;

    public function test_fuel_alert_evaluation_creates_expected_fuel_anomalies(): void
    {
        config([
            'fleet.estimated_tank_capacity_liters' => 100,
            'fleet.expected_fuel_consumption_l_per_100km' => 28,
            'fleet.fuel_anomaly_window_minutes' => 180,
            'fleet.fuel_stationary_distance_km' => 1,
            'fleet.fuel_unexpected_drop_pct' => 8,
            'fleet.fuel_possible_theft_drop_pct' => 12,
            'fleet.fuel_refuel_increase_pct' => 10,
            'fleet.fuel_abnormal_consumption_multiplier' => 1.8,
            'fleet.fuel_min_distance_for_consumption_km' => 10,
        ]);

        $user = User::factory()->create();
        $service = app(AlertEvaluationService::class);

        $stationaryVehicle = Vehicle::factory()->create(['company_id' => $user->company_id]);
        TelemetryEvent::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $stationaryVehicle->id,
            'occurred_at' => now()->subMinutes(30),
            'latitude' => 56.9496,
            'longitude' => 24.1052,
            'speed_kmh' => 0,
            'engine_on' => false,
            'odometer_km' => 1000,
            'fuel_level' => 80,
        ]);
        $stationaryDropEvent = TelemetryEvent::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $stationaryVehicle->id,
            'occurred_at' => now(),
            'latitude' => 56.9496,
            'longitude' => 24.1052,
            'speed_kmh' => 0,
            'engine_on' => false,
            'odometer_km' => 1000.4,
            'fuel_level' => 66,
        ]);
        $stationaryState = VehicleState::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $stationaryVehicle->id,
            'status' => VehicleStatus::Stopped,
            'last_event_at' => now(),
            'odometer_km' => 1000.4,
            'fuel_level' => 66,
        ]);

        $service->evaluateTelemetry($stationaryDropEvent, $stationaryState);

        $movingVehicle = Vehicle::factory()->create(['company_id' => $user->company_id]);
        TelemetryEvent::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $movingVehicle->id,
            'occurred_at' => now()->subMinutes(40),
            'latitude' => 56.9496,
            'longitude' => 24.1052,
            'speed_kmh' => 45,
            'engine_on' => true,
            'odometer_km' => 2000,
            'fuel_level' => 70,
        ]);
        $abnormalConsumptionEvent = TelemetryEvent::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $movingVehicle->id,
            'occurred_at' => now()->subMinutes(5),
            'latitude' => 56.9996,
            'longitude' => 24.2052,
            'speed_kmh' => 55,
            'engine_on' => true,
            'odometer_km' => 2020,
            'fuel_level' => 40,
        ]);
        $movingState = VehicleState::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $movingVehicle->id,
            'status' => VehicleStatus::Moving,
            'last_event_at' => now()->subMinutes(5),
            'odometer_km' => 2020,
            'fuel_level' => 40,
        ]);

        $service->evaluateTelemetry($abnormalConsumptionEvent, $movingState);

        $refuelVehicle = Vehicle::factory()->create(['company_id' => $user->company_id]);
        TelemetryEvent::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $refuelVehicle->id,
            'occurred_at' => now()->subMinutes(20),
            'latitude' => 56.9496,
            'longitude' => 24.1052,
            'speed_kmh' => 0,
            'engine_on' => false,
            'odometer_km' => 3000,
            'fuel_level' => 35,
        ]);
        $refuelEvent = TelemetryEvent::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $refuelVehicle->id,
            'occurred_at' => now()->subMinutes(2),
            'latitude' => 56.9496,
            'longitude' => 24.1052,
            'speed_kmh' => 0,
            'engine_on' => false,
            'odometer_km' => 3000.2,
            'fuel_level' => 50,
        ]);
        $refuelState = VehicleState::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $refuelVehicle->id,
            'status' => VehicleStatus::Stopped,
            'last_event_at' => now()->subMinutes(2),
            'odometer_km' => 3000.2,
            'fuel_level' => 50,
        ]);

        $service->evaluateTelemetry($refuelEvent, $refuelState);

        $this->assertDatabaseHas('alerts', ['type' => AlertType::UnexpectedFuelDrop->value, 'vehicle_id' => $stationaryVehicle->id]);
        $this->assertDatabaseHas('alerts', ['type' => AlertType::PossibleFuelTheft->value, 'vehicle_id' => $stationaryVehicle->id]);
        $this->assertDatabaseHas('alerts', ['type' => AlertType::AbnormalFuelConsumption->value, 'vehicle_id' => $movingVehicle->id]);
        $this->assertDatabaseHas('alerts', ['type' => AlertType::RefuelWithoutTrip->value, 'vehicle_id' => $refuelVehicle->id]);
    }

    public function test_fuel_insights_endpoint_returns_summary_and_paginated_rows(): void
    {
        $user = User::factory()->create();
        $vehicle = Vehicle::factory()->create([
            'company_id' => $user->company_id,
            'plate_number' => 'FUEL-101',
            'name' => 'Fuel Vehicle',
        ]);

        Alert::factory()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'type' => AlertType::UnexpectedFuelDrop,
            'severity' => 'high',
            'context' => ['fuel_delta_pct' => -11.5, 'distance_delta_km' => 0.4],
        ]);

        Alert::factory()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'type' => AlertType::PossibleFuelTheft,
            'severity' => 'high',
            'context' => ['fuel_delta_pct' => -16.2, 'distance_delta_km' => 0.2],
        ]);

        Alert::factory()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'type' => AlertType::RefuelWithoutTrip,
            'severity' => 'medium',
            'resolved_at' => now(),
            'context' => ['fuel_delta_pct' => 12.0, 'distance_delta_km' => 0.1],
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/fuel-insights?search=FUEL&per_page=10')
            ->assertOk()
            ->assertJsonPath('summary.total_anomalies', 3)
            ->assertJsonPath('summary.active_anomalies', 2)
            ->assertJsonPath('summary.affected_vehicles', 1)
            ->assertJsonPath('summary.unexpected_drop_count', 1)
            ->assertJsonPath('summary.possible_theft_count', 1)
            ->assertJsonPath('summary.refuel_without_trip_count', 1)
            ->assertJsonPath('summary.abnormal_consumption_count', 0)
            ->assertJsonPath('data.0.vehicle.plate_number', 'FUEL-101');
    }

    public function test_company_admin_can_manually_resolve_fuel_alert(): void
    {
        $user = User::factory()->create(['role' => \App\Domain\Shared\Enums\UserRole::Admin]);
        $vehicle = Vehicle::factory()->create(['company_id' => $user->company_id]);
        $alert = Alert::factory()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'type' => AlertType::AbnormalFuelConsumption,
            'resolved_at' => null,
        ]);

        Sanctum::actingAs($user);

        $this->postJson("/api/v1/alerts/{$alert->id}/resolve")
            ->assertOk()
            ->assertJsonPath('message', 'Alert resolved successfully.')
            ->assertJsonPath('data.status', 'resolved')
            ->assertJsonPath('data.resolved_by_user_id', $user->id)
            ->assertJsonPath('data.resolved_by.id', $user->id);

        $this->assertNotNull($alert->fresh()->resolved_at);
        $this->assertSame($user->id, $alert->fresh()->resolved_by_user_id);
    }

    public function test_resolved_fuel_alerts_do_not_appear_in_suspicious_vehicle_summary(): void
    {
        $user = User::factory()->create();
        $vehicle = Vehicle::factory()->create([
            'company_id' => $user->company_id,
            'plate_number' => 'FUEL-404',
            'name' => 'Resolved Vehicle',
        ]);

        Alert::factory()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'type' => AlertType::AbnormalFuelConsumption,
            'severity' => 'medium',
            'resolved_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/fuel-insights')
            ->assertOk()
            ->assertJsonCount(0, 'summary.suspicious_vehicles');
    }
}
