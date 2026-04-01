<?php

namespace Database\Factories;

use App\Domain\Companies\Models\Company;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Maintenance\Models\MaintenanceSchedule;
use Illuminate\Database\Eloquent\Factories\Factory;

class MaintenanceScheduleFactory extends Factory
{
    protected $model = MaintenanceSchedule::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'vehicle_id' => Vehicle::factory(),
            'name' => 'Oil change',
            'interval_days' => 180,
            'interval_km' => 20000,
            'next_due_date' => now()->addMonths(6)->toDateString(),
            'next_due_odometer_km' => 210000,
            'is_active' => true,
        ];
    }
}
