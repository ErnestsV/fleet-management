<?php

namespace Tests\Feature\Trips;

use App\Domain\Trips\Models\Trip;
use App\Models\User;
use Illuminate\Support\Carbon;
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

    public function test_trip_list_returns_trip_quality_summary(): void
    {
        $user = User::factory()->create(['timezone' => 'UTC']);

        Trip::factory()->create([
            'company_id' => $user->company_id,
            'start_time' => Carbon::parse('2026-04-05T06:30:00Z'),
            'end_time' => Carbon::parse('2026-04-05T07:00:00Z'),
            'distance_km' => 10,
            'duration_seconds' => 1800,
        ]);

        Trip::factory()->create([
            'company_id' => $user->company_id,
            'start_time' => Carbon::parse('2026-04-05T10:00:00Z'),
            'end_time' => Carbon::parse('2026-04-05T11:00:00Z'),
            'distance_km' => 20,
            'duration_seconds' => 3600,
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/trips')
            ->assertOk()
            ->assertJsonPath('summary.trip_count', 2)
            ->assertJsonPath('summary.total_distance_km', 30)
            ->assertJsonPath('summary.average_trip_distance_km', 15)
            ->assertJsonPath('summary.average_trip_duration_minutes', 45)
            ->assertJsonPath('summary.total_drive_hours', 1.5)
            ->assertJsonPath('summary.after_hours_trip_count', 1);
    }
}
