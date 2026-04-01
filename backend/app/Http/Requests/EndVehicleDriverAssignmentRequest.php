<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EndVehicleDriverAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role?->value, ['super_admin', 'owner', 'admin', 'dispatcher'], true);
    }

    public function rules(): array
    {
        return [
            'assigned_until' => ['required', 'date'],
        ];
    }
}
