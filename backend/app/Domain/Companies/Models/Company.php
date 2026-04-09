<?php

namespace App\Domain\Companies\Models;

use App\Domain\Fleet\Models\Driver;
use App\Domain\Fleet\Models\Vehicle;
use App\Models\User;
use Database\Factories\CompanyFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string $timezone
 * @property array<string, mixed>|null $settings
 * @property bool $is_active
 */
class Company extends Model
{
    /** @use HasFactory<CompanyFactory> */
    use HasFactory, SoftDeletes;

    protected static function newFactory(): Factory
    {
        return CompanyFactory::new();
    }

    protected $fillable = [
        'name',
        'slug',
        'timezone',
        'settings',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'is_active' => 'bool',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class);
    }

    public function drivers(): HasMany
    {
        return $this->hasMany(Driver::class);
    }

    public function speedAlertThresholdKmh(): float
    {
        /** @var array<string, mixed>|null $settings */
        $settings = $this->getAttribute('settings');

        return min(
            max(
                (float) data_get($settings, 'speed_alert_threshold_kmh', config('fleet.speed_alert_threshold_kmh', 90)),
                1
            ),
            300
        );
    }
}
