<?php

namespace Tests\Feature\Dashboard;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Alerts\Models\Alert;
use App\Domain\Fleet\Services\Dashboard\DashboardQueryFactory;
use App\Domain\Fleet\Models\Driver;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Fleet\Models\VehicleDriverAssignment;
use App\Domain\Trips\Models\Trip;
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
                'fleet_utilization',
                'fleet_risk',
                'telemetry_health',
                'fuel_anomalies',
                'geofence_analytics',
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

    public function test_dashboard_summary_uses_odometer_deltas_for_mileage_cards(): void
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
            'speed_kmh' => 12,
            'engine_on' => true,
        ]);

        TelemetryEvent::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'occurred_at' => now()->subDay()->setTime(18, 0),
            'latitude' => 56.9696,
            'longitude' => 24.1252,
            'odometer_km' => 15090,
            'fuel_level' => 72,
            'speed_kmh' => 0,
            'engine_on' => false,
        ]);

        TelemetryEvent::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'occurred_at' => now()->subDays(2)->setTime(9, 0),
            'latitude' => 56.9496,
            'longitude' => 24.1052,
            'odometer_km' => 14900,
            'fuel_level' => 78,
            'speed_kmh' => 5,
            'engine_on' => true,
        ]);

        TelemetryEvent::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'occurred_at' => now()->subDays(2)->setTime(18, 0),
            'latitude' => 56.9596,
            'longitude' => 24.1152,
            'odometer_km' => 14940,
            'fuel_level' => 75,
            'speed_kmh' => 0,
            'engine_on' => false,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/dashboard/summary')
            ->assertOk();

        $mileage = $response->json('mileage');

        $this->assertSame(90.0, (float) $mileage['yesterday_distance_km']);
        $this->assertSame(40.0, (float) $mileage['previous_distance_km']);
        $this->assertSame(125.0, (float) $mileage['delta_pct']);
    }

    public function test_dashboard_summary_returns_fleet_utilization_metrics(): void
    {
        $user = User::factory()->create();

        $activeVehicle = Vehicle::factory()->create([
            'company_id' => $user->company_id,
            'plate_number' => 'ACTIVE-1',
        ]);
        $unusedVehicle = Vehicle::factory()->create([
            'company_id' => $user->company_id,
            'plate_number' => 'UNUSED-1',
        ]);
        $idlingVehicle = Vehicle::factory()->create([
            'company_id' => $user->company_id,
            'plate_number' => 'IDLING-1',
        ]);
        $shortTripVehicle = Vehicle::factory()->create([
            'company_id' => $user->company_id,
            'plate_number' => 'SHORT-1',
        ]);

        VehicleState::create([
            'company_id' => $user->company_id,
            'vehicle_id' => $idlingVehicle->id,
            'status' => VehicleStatus::Idling,
            'last_event_at' => now(),
            'idling_started_at' => now()->subHours(3),
        ]);

        Trip::factory()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $activeVehicle->id,
            'start_time' => now()->setTime(8, 0),
            'end_time' => now()->setTime(9, 0),
            'distance_km' => 18,
        ]);

        Trip::factory()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $activeVehicle->id,
            'start_time' => now()->subDays(1)->setTime(8, 0),
            'end_time' => now()->subDays(1)->setTime(9, 0),
            'distance_km' => 15,
        ]);

        Trip::factory()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $idlingVehicle->id,
            'start_time' => now()->subDays(1)->setTime(10, 0),
            'end_time' => now()->subDays(1)->setTime(11, 0),
            'distance_km' => 9,
        ]);

        Trip::factory()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $shortTripVehicle->id,
            'start_time' => now()->setTime(11, 0),
            'end_time' => now()->setTime(11, 20),
            'distance_km' => 3.5,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/dashboard/summary')
            ->assertOk();

        $utilization = $response->json('fleet_utilization');

        $this->assertSame(2, $utilization['active_today']['count']);
        $this->assertSame(50.0, (float) $utilization['active_today']['percentage']);
        $this->assertSame(1, $utilization['unused_over_3_days']['count']);
        $this->assertSame(25.0, (float) $utilization['unused_over_3_days']['percentage']);
        $this->assertSame(1, $utilization['idling_over_threshold']['count']);
        $this->assertSame(25.0, (float) $utilization['idling_over_threshold']['percentage']);
        $this->assertSame(2, $utilization['no_trips_today']['count']);
        $this->assertSame(50.0, (float) $utilization['no_trips_today']['percentage']);
        $this->assertSame(1, $utilization['short_trips_only_today']['count']);
        $this->assertSame(25.0, (float) $utilization['short_trips_only_today']['percentage']);
    }

    public function test_dashboard_summary_returns_explainable_fleet_risk_overview(): void
    {
        $user = User::factory()->create();

        $vehicleWithoutDriverA = Vehicle::factory()->create(['company_id' => $user->company_id]);
        $vehicleWithoutDriverB = Vehicle::factory()->create(['company_id' => $user->company_id]);
        $vehicleWithoutDriverC = Vehicle::factory()->create(['company_id' => $user->company_id]);
        $vehicleWithDriver = Vehicle::factory()->create(['company_id' => $user->company_id]);

        VehicleState::create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicleWithoutDriverA->id,
            'status' => VehicleStatus::Offline,
            'last_event_at' => now()->subHours(30),
        ]);

        Alert::factory()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicleWithoutDriverA->id,
            'type' => AlertType::MaintenanceDue,
            'resolved_at' => null,
            'triggered_at' => now()->subHour(),
        ]);

        Alert::factory()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicleWithoutDriverB->id,
            'type' => AlertType::UnexpectedFuelDrop,
            'resolved_at' => null,
            'triggered_at' => now()->subMinutes(30),
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/dashboard/summary')
            ->assertOk();

        $risk = $response->json('fleet_risk');

        $this->assertSame('high', $risk['overall']['level']);
        $this->assertSame(0, $risk['overall']['high_driver_count']);
        $this->assertSame(4, $risk['overall']['medium_driver_count']);
        $this->assertEqualsCanonicalizing(
            ['maintenance_overdue', 'offline_vehicles', 'unassigned_vehicles', 'active_alerts', 'active_fuel_anomalies'],
            collect($risk['drivers'])->pluck('key')->all(),
        );
        $this->assertSame(0, collect($risk['drivers'])->firstWhere('key', 'active_alerts')['count']);
        $this->assertSame('medium', collect($risk['drivers'])->firstWhere('key', 'maintenance_overdue')['severity']);
        $this->assertSame('medium', collect($risk['drivers'])->firstWhere('key', 'offline_vehicles')['severity']);
        $this->assertSame('medium', collect($risk['drivers'])->firstWhere('key', 'unassigned_vehicles')['severity']);
    }

    public function test_dashboard_summary_active_alerts_excludes_geofence_exit_but_keeps_geofence_entry(): void
    {
        $user = User::factory()->create();
        $vehicle = Vehicle::factory()->create(['company_id' => $user->company_id]);

        Alert::factory()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'type' => AlertType::GeofenceEntry,
            'resolved_at' => null,
            'triggered_at' => now()->subMinutes(10),
        ]);

        Alert::factory()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'type' => AlertType::GeofenceExit,
            'resolved_at' => null,
            'triggered_at' => now()->subMinutes(5),
        ]);

        Alert::factory()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicle->id,
            'type' => AlertType::Speeding,
            'resolved_at' => null,
            'triggered_at' => now()->subMinute(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/dashboard/summary')
            ->assertOk();

        $this->assertSame(2, $response->json('active_alerts'));

        $headlineAlertTypes = app(DashboardQueryFactory::class)
            ->activeDashboardHeadlineAlertsQuery($user->company_id, $user)
            ->pluck('type')
            ->map(fn ($type) => $type instanceof AlertType ? $type->value : $type)
            ->all();

        $this->assertEqualsCanonicalizing(
            [AlertType::GeofenceEntry->value, AlertType::Speeding->value],
            $headlineAlertTypes,
        );
    }
}
