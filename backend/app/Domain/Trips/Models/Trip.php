<?php

namespace App\Domain\Trips\Models;

use App\Domain\Fleet\Models\Vehicle;
use Database\Factories\TripFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $company_id
 * @property int $vehicle_id
 * @property \Illuminate\Support\Carbon|null $start_time
 * @property \Illuminate\Support\Carbon|null $end_time
 * @property array<string, mixed>|null $start_snapshot
 * @property array<string, mixed>|null $end_snapshot
 * @property float $distance_km
 * @property int $duration_seconds
 * @property float $average_speed_kmh
 * @property Vehicle|null $vehicle
 */
class Trip extends Model
{
    /** @use HasFactory<TripFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return TripFactory::new();
    }

    protected $fillable = [
        'company_id',
        'vehicle_id',
        'start_time',
        'end_time',
        'start_snapshot',
        'end_snapshot',
        'distance_km',
        'duration_seconds',
        'average_speed_kmh',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'start_snapshot' => 'array',
            'end_snapshot' => 'array',
            'distance_km' => 'float',
            'average_speed_kmh' => 'float',
        ];
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }
}
