<?php

namespace App\Domain\Alerts\Models;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Companies\Models\Company;
use App\Domain\Fleet\Models\Vehicle;
use App\Models\User;
use Database\Factories\AlertFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Alert extends Model
{
    /** @use HasFactory<AlertFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return AlertFactory::new();
    }

    protected $fillable = [
        'company_id',
        'vehicle_id',
        'alert_rule_id',
        'type',
        'severity',
        'message',
        'triggered_at',
        'resolved_at',
        'resolved_by_user_id',
        'context',
    ];

    protected function casts(): array
    {
        return [
            'type' => AlertType::class,
            'triggered_at' => 'datetime',
            'resolved_at' => 'datetime',
            'context' => 'array',
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

    public function rule(): BelongsTo
    {
        return $this->belongsTo(AlertRule::class, 'alert_rule_id');
    }

    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by_user_id');
    }
}
