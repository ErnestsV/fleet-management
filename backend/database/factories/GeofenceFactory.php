<?php

namespace Database\Factories;

use App\Domain\Companies\Models\Company;
use App\Domain\Geofences\Enums\GeofenceType;
use App\Domain\Geofences\Models\Geofence;
use Illuminate\Database\Eloquent\Factories\Factory;

class GeofenceFactory extends Factory
{
    protected $model = Geofence::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'name' => fake()->streetName(),
            'type' => GeofenceType::Circle,
            'geometry' => ['center' => ['lat' => 56.95, 'lng' => 24.10], 'radius_m' => 500],
            'is_active' => true,
        ];
    }
}
