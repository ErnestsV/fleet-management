<?php

namespace App\Domain\Telemetry\Models;

use App\Domain\Companies\Models\Company;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Telemetry\Enums\VehicleStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $company_id
 * @property int $vehicle_id
 * @property \App\Domain\Telemetry\Enums\VehicleStatus|null $status
 * @property \Illuminate\Support\Carbon|null $last_event_at
 * @property float|null $latitude
 * @property float|null $longitude
 * @property float|null $speed_kmh
 * @property bool|null $engine_on
 * @property float|null $odometer_km
 * @property float|null $fuel_level
 * @property float|null $heading
 * @property \Illuminate\Support\Carbon|null $moving_started_at
 * @property \Illuminate\Support\Carbon|null $idling_started_at
 * @property \Illuminate\Support\Carbon|null $stopped_started_at
 * @property \Illuminate\Support\Carbon|null $offline_marked_at
 * @property array<int>|null $last_geofence_ids
 * @property \App\Domain\Companies\Models\Company $company
 * @property \App\Domain\Fleet\Models\Vehicle $vehicle
 */
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
        'last_geofence_ids',
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
