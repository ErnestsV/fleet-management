<?php

namespace Tests\Feature\Geofences;

use App\Domain\Shared\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GeofenceManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_and_update_geofence(): void
    {
        $user = User::factory()->create(['role' => UserRole::Admin]);
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/geofences', [
            'name' => 'Depot',
            'type' => 'circle',
            'geometry' => [
                'center' => ['lat' => 56.95, 'lng' => 24.10],
                'radius_m' => 500,
            ],
            'is_active' => true,
        ])->assertCreated();

        $geofenceId = $response->json('data.id') ?? $response->json('id');

        $this->patchJson("/api/v1/geofences/{$geofenceId}", [
            'name' => 'Depot Updated',
            'type' => 'circle',
            'geometry' => [
                'center' => ['lat' => 56.95, 'lng' => 24.10],
                'radius_m' => 700,
            ],
            'is_active' => true,
        ])->assertOk();
    }
}
