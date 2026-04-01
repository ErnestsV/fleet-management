<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreVehicleDriverAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role?->value, ['super_admin', 'owner', 'admin', 'dispatcher'], true);
    }

    public function rules(): array
    {
        $companyId = $this->user()?->company_id;

        return [
            'vehicle_id' => [
                'required',
                'integer',
                Rule::exists('vehicles', 'id')->when(
                    ! $this->user()?->isSuperAdmin(),
                    fn ($rule) => $rule->where('company_id', $companyId)
                ),
            ],
            'driver_id' => [
                'required',
                'integer',
                Rule::exists('drivers', 'id')->when(
                    ! $this->user()?->isSuperAdmin(),
                    fn ($rule) => $rule->where('company_id', $companyId)
                ),
            ],
            'assigned_from' => ['required', 'date'],
            'assigned_until' => ['nullable', 'date', 'after_or_equal:assigned_from'],
        ];
    }
}
