<?php

namespace Tests\Feature\Alerts;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Alerts\Models\Alert;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AlertListingTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_filter_alerts_by_status_and_type(): void
    {
        $user = User::factory()->create();
        Alert::factory()->create(['company_id' => $user->company_id, 'type' => AlertType::Speeding]);
        Alert::factory()->create(['company_id' => $user->company_id, 'type' => AlertType::OfflineVehicle, 'resolved_at' => now()]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/alerts?type=speeding&status=active')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_alert_list_rejects_invalid_sort_column(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/alerts?sort=company_id')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['sort']);
    }
}
