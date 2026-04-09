<?php

namespace Tests\Feature\Telemetry;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Telemetry\Models\DeviceToken;
use App\Domain\Companies\Models\Company;
use App\Domain\Fleet\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SpeedAlertThresholdTest extends TestCase
{
    use RefreshDatabase;

    public function test_speeding_alert_uses_company_speed_threshold(): void
    {
        $company = Company::factory()->create([
            'settings' => [
                'speed_alert_threshold_kmh' => 110,
                'idling_alert_threshold_minutes' => 15,
            ],
        ]);
        $vehicle = Vehicle::factory()->create(['company_id' => $company->id]);
        $plainToken = 'company-threshold-token';

        DeviceToken::create([
            'company_id' => $company->id,
            'vehicle_id' => $vehicle->id,
            'name' => 'Test',
            'token' => hash('sha256', $plainToken),
            'is_active' => true,
        ]);

        $this->withHeader('Authorization', 'Bearer '.$plainToken)
            ->postJson('/api/v1/telemetry/events', [
                'timestamp' => now()->toIso8601String(),
                'latitude' => 56.95,
                'longitude' => 24.10,
                'speed_kmh' => 105,
                'engine_on' => true,
            ])
            ->assertStatus(202);

        $this->assertDatabaseMissing('alerts', [
            'vehicle_id' => $vehicle->id,
            'type' => AlertType::Speeding->value,
        ]);

        $this->withHeader('Authorization', 'Bearer '.$plainToken)
            ->postJson('/api/v1/telemetry/events', [
                'timestamp' => now()->addMinute()->toIso8601String(),
                'latitude' => 56.96,
                'longitude' => 24.11,
                'speed_kmh' => 115,
                'engine_on' => true,
            ])
            ->assertStatus(202);

        $this->assertDatabaseHas('alerts', [
            'vehicle_id' => $vehicle->id,
            'type' => AlertType::Speeding->value,
        ]);
    }

    public function test_speeding_alert_resolves_after_three_consecutive_non_speeding_events(): void
    {
        $company = Company::factory()->create([
            'settings' => [
                'speed_alert_threshold_kmh' => 90,
                'idling_alert_threshold_minutes' => 15,
            ],
        ]);
        $vehicle = Vehicle::factory()->create(['company_id' => $company->id]);
        $plainToken = 'speed-recovery-token';

        DeviceToken::create([
            'company_id' => $company->id,
            'vehicle_id' => $vehicle->id,
            'name' => 'Test',
            'token' => hash('sha256', $plainToken),
            'is_active' => true,
        ]);

        $baseTime = now()->startOfMinute();

        $this->withHeader('Authorization', 'Bearer '.$plainToken)
            ->postJson('/api/v1/telemetry/events', [
                'timestamp' => $baseTime->toIso8601String(),
                'latitude' => 56.95,
                'longitude' => 24.10,
                'speed_kmh' => 95,
                'engine_on' => true,
            ])
            ->assertStatus(202);

        $alert = \App\Domain\Alerts\Models\Alert::query()
            ->where('vehicle_id', $vehicle->id)
            ->where('type', AlertType::Speeding)
            ->firstOrFail();

        $this->withHeader('Authorization', 'Bearer '.$plainToken)
            ->postJson('/api/v1/telemetry/events', [
                'timestamp' => $baseTime->copy()->addMinute()->toIso8601String(),
                'latitude' => 56.951,
                'longitude' => 24.101,
                'speed_kmh' => 85,
                'engine_on' => true,
            ])
            ->assertStatus(202);

        $this->assertNull($alert->fresh()->resolved_at);

        $this->withHeader('Authorization', 'Bearer '.$plainToken)
            ->postJson('/api/v1/telemetry/events', [
                'timestamp' => $baseTime->copy()->addMinutes(2)->toIso8601String(),
                'latitude' => 56.952,
                'longitude' => 24.102,
                'speed_kmh' => 80,
                'engine_on' => true,
            ])
            ->assertStatus(202);

        $this->assertNull($alert->fresh()->resolved_at);

        $this->withHeader('Authorization', 'Bearer '.$plainToken)
            ->postJson('/api/v1/telemetry/events', [
                'timestamp' => $baseTime->copy()->addMinutes(3)->toIso8601String(),
                'latitude' => 56.953,
                'longitude' => 24.103,
                'speed_kmh' => 75,
                'engine_on' => true,
            ])
            ->assertStatus(202);

        $this->assertNotNull($alert->fresh()->resolved_at);
    }
}
