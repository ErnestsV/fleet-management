<?php

namespace Database\Factories;

use App\Domain\Companies\Models\Company;
use App\Domain\Fleet\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

class VehicleFactory extends Factory
{
    protected $model = Vehicle::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'name' => fake()->company().' Van',
            'plate_number' => strtoupper(fake()->bothify('??-####')),
            'vin' => strtoupper(fake()->bothify('#################')),
            'make' => fake()->randomElement(['Volvo', 'Mercedes-Benz', 'Scania', 'Toyota']),
            'model' => fake()->randomElement(['Actros', 'FH', 'Hilux', 'R450']),
            'year' => fake()->numberBetween(2017, 2025),
            'device_identifier' => fake()->uuid(),
            'is_active' => true,
        ];
    }
}
