<?php

namespace Database\Factories;

use App\Domain\Companies\Models\Company;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Trips\Models\Trip;
use Illuminate\Database\Eloquent\Factories\Factory;

class TripFactory extends Factory
{
    protected $model = Trip::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'vehicle_id' => Vehicle::factory(),
            'start_time' => now()->subHour(),
            'end_time' => now(),
            'start_snapshot' => ['latitude' => 56.95, 'longitude' => 24.10],
            'end_snapshot' => ['latitude' => 56.99, 'longitude' => 24.20],
            'distance_km' => 22.5,
            'duration_seconds' => 3600,
            'average_speed_kmh' => 45.2,
        ];
    }
}
