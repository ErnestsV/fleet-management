<?php

namespace Database\Factories;

use App\Domain\Companies\Models\Company;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Maintenance\Models\MaintenanceRecord;
use Illuminate\Database\Eloquent\Factories\Factory;

class MaintenanceRecordFactory extends Factory
{
    protected $model = MaintenanceRecord::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'vehicle_id' => Vehicle::factory(),
            'title' => 'Routine service',
            'service_date' => now()->subMonth()->toDateString(),
            'odometer_km' => 180000,
            'cost_amount' => 350,
            'currency' => 'EUR',
            'notes' => fake()->sentence(),
        ];
    }
}
