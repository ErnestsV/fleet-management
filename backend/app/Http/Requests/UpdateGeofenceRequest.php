<?php

namespace App\Http\Requests;

use App\Domain\Geofences\Models\Geofence;
use Illuminate\Foundation\Http\FormRequest;

class UpdateGeofenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Geofence $geofence */
        $geofence = $this->route('geofence');

        return $this->user()?->can('update', $geofence) ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:circle,polygon'],
            'geometry' => ['required', 'array'],
            'geometry.center.lat' => ['required_if:type,circle', 'numeric', 'between:-90,90'],
            'geometry.center.lng' => ['required_if:type,circle', 'numeric', 'between:-180,180'],
            'geometry.radius_m' => ['required_if:type,circle', 'numeric', 'min:1'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
