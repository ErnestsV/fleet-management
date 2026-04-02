<?php

namespace Tests\Feature\Alerts;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Alerts\Models\Alert;
use App\Domain\Alerts\Services\AlertEvaluationService;
use App\Domain\Fleet\Models\Driver;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DriverLicenseAlertTest extends TestCase
{
    use RefreshDatabase;

    public function test_expired_driver_license_alert_does_not_store_full_license_number_in_context(): void
    {
        $user = User::factory()->create();
        $driver = Driver::factory()->create([
            'company_id' => $user->company_id,
            'license_number' => 'ABC-123456',
            'license_expires_at' => now()->subDay(),
            'is_active' => true,
        ]);

        app(AlertEvaluationService::class)->evaluateDriverLicense($driver);

        $alert = Alert::query()
            ->where('company_id', $user->company_id)
            ->where('type', AlertType::DriverLicenseExpired)
            ->firstOrFail();

        $this->assertSame($driver->id, data_get($alert->context, 'driver_id'));
        $this->assertNull(data_get($alert->context, 'license_number'));
    }

    public function test_driver_license_command_resolves_stale_alert_when_driver_becomes_inactive(): void
    {
        $user = User::factory()->create();
        $driver = Driver::factory()->create([
            'company_id' => $user->company_id,
            'license_expires_at' => now()->subDay(),
            'is_active' => false,
        ]);

        $alert = Alert::query()->create([
            'company_id' => $user->company_id,
            'vehicle_id' => null,
            'type' => AlertType::DriverLicenseExpired,
            'severity' => 'medium',
            'message' => 'Driver has an expired license.',
            'triggered_at' => now()->subDay(),
            'context' => [
                'driver_id' => $driver->id,
                'driver_name' => $driver->name,
                'license_expires_at' => now()->subDay()->toDateString(),
            ],
        ]);

        $this->artisan('app:check-driver-licenses')->assertSuccessful();

        $this->assertNotNull($alert->fresh()->resolved_at);
    }
}
