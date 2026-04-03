<?php

namespace Tests\Feature\Geofences;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Alerts\Models\Alert;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Geofences\Models\Geofence;
use App\Domain\Telemetry\Models\TelemetryEvent;
use App\Domain\Telemetry\Models\VehicleState;
use App\Domain\Geofences\Services\GeofenceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GeofenceAlertFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_entry_state_persists_and_exit_resolves_prior_entry_alert(): void
    {
        $vehicle = Vehicle::factory()->create();

        $state = VehicleState::query()->create([
            'company_id' => $vehicle->company_id,
            'vehicle_id' => $vehicle->id,
            'status' => 'stopped',
            'last_event_at' => now(),
            'latitude' => 56.93,
            'longitude' => 24.07,
            'speed_kmh' => 0,
            'engine_on' => false,
            'last_geofence_ids' => [],
        ]);

        $geofence = Geofence::query()->create([
            'company_id' => $vehicle->company_id,
            'name' => 'Riga Depot',
            'type' => 'circle',
            'geometry' => [
                'center' => ['lat' => 56.9496, 'lng' => 24.1052],
                'radius_m' => 500,
            ],
            'is_active' => true,
        ]);

        $service = app(GeofenceService::class);

        $entryEvent = TelemetryEvent::query()->create([
            'company_id' => $vehicle->company_id,
            'vehicle_id' => $vehicle->id,
            'occurred_at' => '2026-04-03T09:05:00Z',
            'latitude' => 56.9496,
            'longitude' => 24.1052,
            'speed_kmh' => 20,
            'engine_on' => true,
            'odometer_km' => 50040,
            'fuel_level' => 76,
            'heading' => 130,
            'payload' => [],
        ]);

        $service->syncEvent($entryEvent, $state);

        $state->refresh();

        $this->assertSame([$geofence->id], $state->last_geofence_ids);

        $entryAlert = Alert::query()
            ->where('vehicle_id', $vehicle->id)
            ->where('type', AlertType::GeofenceEntry)
            ->first();

        $this->assertNotNull($entryAlert);
        $this->assertNull($entryAlert->resolved_at);

        $exitEvent = TelemetryEvent::query()->create([
            'company_id' => $vehicle->company_id,
            'vehicle_id' => $vehicle->id,
            'occurred_at' => '2026-04-03T09:10:00Z',
            'latitude' => 56.9300,
            'longitude' => 24.0700,
            'speed_kmh' => 25,
            'engine_on' => true,
            'odometer_km' => 50045,
            'fuel_level' => 75,
            'heading' => 220,
            'payload' => [],
        ]);

        $service->syncEvent($exitEvent, $state->fresh());

        $state->refresh();
        $entryAlert->refresh();

        $this->assertSame([], $state->last_geofence_ids);
        $this->assertNotNull($entryAlert->resolved_at);

        $exitAlert = Alert::query()
            ->where('vehicle_id', $vehicle->id)
            ->where('type', AlertType::GeofenceExit)
            ->first();

        $this->assertNotNull($exitAlert);
        $this->assertNull($exitAlert->resolved_at);
    }
}
