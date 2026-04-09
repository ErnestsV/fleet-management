<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class IngestTelemetryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vehicle_id' => ['nullable', 'integer', 'exists:vehicles,id'],
            'message_id' => ['nullable', 'string', 'max:120'],
            'timestamp' => ['required', 'date'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'speed_kmh' => ['required', 'numeric', 'min:0', 'max:300'],
            'engine_on' => ['required', 'boolean'],
            'odometer_km' => ['nullable', 'numeric', 'min:0'],
            'fuel_level' => ['nullable', 'numeric', 'between:0,100'],
            'heading' => ['nullable', 'numeric', 'between:0,360'],
        ];
    }
}
