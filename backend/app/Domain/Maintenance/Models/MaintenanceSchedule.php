<?php

namespace App\Domain\Maintenance\Models;

use App\Domain\Fleet\Models\Vehicle;
use Database\Factories\MaintenanceScheduleFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceSchedule extends Model
{
    /** @use HasFactory<MaintenanceScheduleFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return MaintenanceScheduleFactory::new();
    }

    protected $fillable = [
        'company_id',
        'vehicle_id',
        'name',
        'interval_days',
        'interval_km',
        'next_due_date',
        'next_due_odometer_km',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'next_due_date' => 'date',
            'interval_km' => 'float',
            'next_due_odometer_km' => 'float',
            'is_active' => 'bool',
        ];
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }
}
