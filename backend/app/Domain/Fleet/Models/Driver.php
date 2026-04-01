<?php

namespace App\Domain\Fleet\Models;

use App\Domain\Companies\Models\Company;
use Database\Factories\DriverFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Driver extends Model
{
    /** @use HasFactory<DriverFactory> */
    use HasFactory, SoftDeletes;

    protected static function newFactory(): Factory
    {
        return DriverFactory::new();
    }

    protected $fillable = [
        'company_id',
        'name',
        'email',
        'phone',
        'license_number',
        'license_expires_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'license_expires_at' => 'datetime',
            'is_active' => 'bool',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(VehicleDriverAssignment::class);
    }
}
