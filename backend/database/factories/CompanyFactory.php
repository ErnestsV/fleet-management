<?php

namespace Database\Factories;

use App\Domain\Companies\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class CompanyFactory extends Factory
{
    protected $model = Company::class;

    public function definition(): array
    {
        $name = fake()->company();

        return [
            'name' => $name,
            'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(10, 999),
            'timezone' => 'Europe/Riga',
            'settings' => [
                'speed_alert_threshold_kmh' => 90,
                'idling_alert_threshold_minutes' => 15,
            ],
            'is_active' => true,
        ];
    }
}
