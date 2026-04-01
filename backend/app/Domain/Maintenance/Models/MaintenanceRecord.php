<?php

namespace App\Domain\Maintenance\Models;

use App\Domain\Fleet\Models\Vehicle;
use Database\Factories\MaintenanceRecordFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceRecord extends Model
{
    /** @use HasFactory<MaintenanceRecordFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return MaintenanceRecordFactory::new();
    }

    protected $fillable = [
        'company_id',
        'vehicle_id',
        'maintenance_schedule_id',
        'title',
        'service_date',
        'odometer_km',
        'cost_amount',
        'currency',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'service_date' => 'date',
            'odometer_km' => 'float',
            'cost_amount' => 'float',
        ];
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }
}
