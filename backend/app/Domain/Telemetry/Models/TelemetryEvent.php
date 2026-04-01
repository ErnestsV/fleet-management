<?php

namespace App\Domain\Telemetry\Models;

use App\Domain\Companies\Models\Company;
use App\Domain\Fleet\Models\Vehicle;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TelemetryEvent extends Model
{
    protected $fillable = [
        'company_id',
        'vehicle_id',
        'occurred_at',
        'latitude',
        'longitude',
        'speed_kmh',
        'engine_on',
        'odometer_km',
        'fuel_level',
        'heading',
        'payload',
    ];

    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
            'latitude' => 'float',
            'longitude' => 'float',
            'speed_kmh' => 'float',
            'engine_on' => 'bool',
            'odometer_km' => 'float',
            'fuel_level' => 'float',
            'heading' => 'float',
            'payload' => 'array',
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
