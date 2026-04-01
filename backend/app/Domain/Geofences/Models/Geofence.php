<?php

namespace App\Domain\Geofences\Models;

use App\Domain\Geofences\Enums\GeofenceType;
use Database\Factories\GeofenceFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Geofence extends Model
{
    /** @use HasFactory<GeofenceFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return GeofenceFactory::new();
    }

    protected $fillable = [
        'company_id',
        'name',
        'type',
        'geometry',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'type' => GeofenceType::class,
            'geometry' => 'array',
            'is_active' => 'bool',
        ];
    }
}
