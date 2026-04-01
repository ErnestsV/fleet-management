<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMaintenanceScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role?->value, ['super_admin', 'owner', 'admin', 'dispatcher'], true);
    }

    public function rules(): array
    {
        $companyId = $this->user()?->company_id;

        return [
            'company_id' => ['nullable', 'integer', 'exists:companies,id'],
            'vehicle_id' => [
                'required',
                'integer',
                Rule::exists('vehicles', 'id')->when(
                    ! $this->user()?->isSuperAdmin(),
                    fn ($rule) => $rule->where('company_id', $companyId)
                ),
            ],
            'name' => ['required', 'string', 'max:255'],
            'interval_days' => ['nullable', 'integer', 'min:1'],
            'interval_km' => ['nullable', 'numeric', 'min:1'],
            'next_due_date' => ['nullable', 'date'],
            'next_due_odometer_km' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
