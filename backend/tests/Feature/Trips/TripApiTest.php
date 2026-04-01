<?php

namespace Tests\Feature\Trips;

use App\Domain\Trips\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TripApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_list_trips(): void
    {
        $user = User::factory()->create();
        Trip::factory()->create(['company_id' => $user->company_id]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/trips')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }
}
