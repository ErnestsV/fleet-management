<?php

namespace App\Http\Requests;

use App\Domain\Alerts\Enums\AlertType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AlertIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'type' => ['nullable', Rule::in(array_map(fn (AlertType $type) => $type->value, AlertType::cases()))],
            'status' => ['nullable', Rule::in(['active', 'resolved'])],
            'exclude_informational' => ['nullable', Rule::in([true, false, 1, 0, '1', '0', 'true', 'false'])],
            'exclude_geofence_exit' => ['nullable', Rule::in([true, false, 1, 0, '1', '0', 'true', 'false'])],
            'vehicle_id' => ['nullable', 'integer', 'exists:vehicles,id'],
            'sort' => ['nullable', Rule::in(['triggered_at', '-triggered_at', 'severity', '-severity'])],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
