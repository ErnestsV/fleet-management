<?php

namespace Database\Factories;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Alerts\Models\Alert;
use App\Domain\Companies\Models\Company;
use App\Domain\Fleet\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

class AlertFactory extends Factory
{
    protected $model = Alert::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'vehicle_id' => Vehicle::factory(),
            'type' => AlertType::Speeding,
            'severity' => 'medium',
            'message' => fake()->sentence(),
            'triggered_at' => now(),
            'context' => ['speed_kmh' => 95],
        ];
    }
}
