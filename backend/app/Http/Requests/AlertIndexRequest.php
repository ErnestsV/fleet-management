<?php

namespace App\Http\Requests;

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
            'type' => ['nullable', Rule::in(['speeding', 'prolonged_idling', 'geofence_entry', 'geofence_exit', 'offline_vehicle', 'maintenance_due'])],
            'status' => ['nullable', Rule::in(['active', 'resolved'])],
            'vehicle_id' => ['nullable', 'integer', 'exists:vehicles,id'],
            'sort' => ['nullable', Rule::in(['triggered_at', '-triggered_at', 'severity', '-severity'])],
        ];
    }
}
