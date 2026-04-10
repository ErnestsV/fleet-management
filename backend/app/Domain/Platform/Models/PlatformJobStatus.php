<?php

namespace App\Domain\Platform\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformJobStatus extends Model
{
    protected $fillable = [
        'job_key',
        'label',
        'frequency',
        'expected_interval_minutes',
        'status',
        'last_started_at',
        'last_finished_at',
        'last_succeeded_at',
        'last_failed_at',
        'last_error',
        'last_runtime_ms',
    ];

    protected function casts(): array
    {
        return [
            'expected_interval_minutes' => 'integer',
            'last_started_at' => 'datetime',
            'last_finished_at' => 'datetime',
            'last_succeeded_at' => 'datetime',
            'last_failed_at' => 'datetime',
            'last_runtime_ms' => 'integer',
        ];
    }
}
