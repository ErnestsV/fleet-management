<?php

namespace App\Domain\Telemetry\Models;

use App\Domain\Companies\Models\Company;
use App\Domain\Fleet\Models\Vehicle;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeviceToken extends Model
{
    public const DEFAULT_NAME = 'Primary device token';

    protected $fillable = [
        'company_id',
        'vehicle_id',
        'name',
        'token',
        'last_used_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'last_used_at' => 'datetime',
            'is_active' => 'bool',
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
