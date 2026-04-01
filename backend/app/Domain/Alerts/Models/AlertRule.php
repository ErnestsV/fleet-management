<?php

namespace App\Domain\Alerts\Models;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Companies\Models\Company;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlertRule extends Model
{
    protected $fillable = [
        'company_id',
        'type',
        'name',
        'is_enabled',
        'configuration',
    ];

    protected function casts(): array
    {
        return [
            'type' => AlertType::class,
            'is_enabled' => 'bool',
            'configuration' => 'array',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
