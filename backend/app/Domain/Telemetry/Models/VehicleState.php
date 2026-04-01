<?php

namespace App\Domain\Telemetry\Models;

use App\Domain\Companies\Models\Company;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Telemetry\Enums\VehicleStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VehicleState extends Model
{
    protected $fillable = [
        'company_id',
        'vehicle_id',
        'status',
        'last_event_at',
        'latitude',
        'longitude',
        'speed_kmh',
        'engine_on',
        'odometer_km',
        'fuel_level',
        'heading',
        'moving_started_at',
        'idling_started_at',
        'stopped_started_at',
        'offline_marked_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => VehicleStatus::class,
            'last_event_at' => 'datetime',
            'latitude' => 'float',
            'longitude' => 'float',
            'speed_kmh' => 'float',
            'engine_on' => 'bool',
            'odometer_km' => 'float',
            'fuel_level' => 'float',
            'heading' => 'float',
            'moving_started_at' => 'datetime',
            'idling_started_at' => 'datetime',
            'stopped_started_at' => 'datetime',
            'offline_marked_at' => 'datetime',
            'last_geofence_ids' => 'array',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }
}
