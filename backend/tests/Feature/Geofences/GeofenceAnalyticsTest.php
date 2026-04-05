<?php

namespace Tests\Feature\Geofences;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Alerts\Models\Alert;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Geofences\Models\Geofence;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GeofenceAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_geofence_analytics_returns_visit_and_dwell_metrics(): void
    {
        $user = User::factory()->create();
        $depot = Geofence::query()->create([
            'company_id' => $user->company_id,
            'name' => 'Depot',
            'type' => 'circle',
            'geometry' => [
                'center' => ['lat' => 56.95, 'lng' => 24.10],
                'radius_m' => 500,
            ],
            'is_active' => true,
        ]);

        $warehouse = Geofence::query()->create([
            'company_id' => $user->company_id,
            'name' => 'Warehouse',
            'type' => 'circle',
            'geometry' => [
                'center' => ['lat' => 56.96, 'lng' => 24.11],
                'radius_m' => 400,
            ],
            'is_active' => true,
        ]);

        $vehicleA = Vehicle::factory()->create(['company_id' => $user->company_id]);
        $vehicleB = Vehicle::factory()->create(['company_id' => $user->company_id]);

        Alert::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicleA->id,
            'type' => AlertType::GeofenceEntry,
            'severity' => 'medium',
            'message' => 'Entered depot',
            'triggered_at' => now()->subHours(6),
            'resolved_at' => now()->subHours(5),
            'context' => ['geofence_id' => $depot->id],
        ]);

        Alert::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicleA->id,
            'type' => AlertType::GeofenceExit,
            'severity' => 'medium',
            'message' => 'Exited depot',
            'triggered_at' => now()->subHours(5),
            'context' => ['geofence_id' => $depot->id],
        ]);

        Alert::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicleB->id,
            'type' => AlertType::GeofenceEntry,
            'severity' => 'medium',
            'message' => 'Entered warehouse',
            'triggered_at' => now()->subHours(4),
            'resolved_at' => now()->subHours(2),
            'context' => ['geofence_id' => $warehouse->id],
        ]);

        Alert::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => $vehicleA->id,
            'type' => AlertType::GeofenceEntry,
            'severity' => 'medium',
            'message' => 'Entered depot again',
            'triggered_at' => now()->subHours(3),
            'resolved_at' => now()->subHours(2),
            'context' => ['geofence_id' => $depot->id],
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/geofence-analytics')
            ->assertOk();

        $this->assertSame(3, $response->json('summary.summary.total_entries'));
        $this->assertSame(1, $response->json('summary.summary.total_exits'));
        $this->assertSame('Warehouse', $response->json('summary.longest_dwell_locations.0.name'));
        $this->assertSame(120.0, (float) $response->json('summary.longest_dwell_locations.0.average_dwell_minutes'));
        $this->assertSame('Depot', $response->json('summary.top_visited_locations.0.name'));
        $this->assertCount(2, $response->json('data'));
    }
}
