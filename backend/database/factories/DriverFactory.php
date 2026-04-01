<?php

namespace Database\Factories;

use App\Domain\Companies\Models\Company;
use App\Domain\Fleet\Models\Driver;
use Illuminate\Database\Eloquent\Factories\Factory;

class DriverFactory extends Factory
{
    protected $model = Driver::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'name' => fake()->name(),
            'email' => fake()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'license_number' => strtoupper(fake()->bothify('LIC-#####')),
            'license_expires_at' => now()->addYear(),
            'is_active' => true,
        ];
    }
}
