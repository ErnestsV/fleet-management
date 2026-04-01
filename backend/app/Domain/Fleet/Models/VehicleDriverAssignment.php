<?php

namespace App\Domain\Fleet\Models;

use App\Domain\Companies\Models\Company;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VehicleDriverAssignment extends Model
{
    protected $fillable = [
        'company_id',
        'vehicle_id',
        'driver_id',
        'assigned_from',
        'assigned_until',
    ];

    protected function casts(): array
    {
        return [
            'assigned_from' => 'datetime',
            'assigned_until' => 'datetime',
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

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }
}
