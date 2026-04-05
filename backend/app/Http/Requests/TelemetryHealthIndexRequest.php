<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TelemetryHealthIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'health_status' => [
                'nullable',
                'string',
                Rule::in(['healthy', 'missing_fields', 'low_frequency', 'stale', 'offline', 'no_data']),
            ],
            'freshness_bucket' => [
                'nullable',
                'string',
                Rule::in(['fresh', 'delayed', 'stale', 'offline', 'no_data']),
            ],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
