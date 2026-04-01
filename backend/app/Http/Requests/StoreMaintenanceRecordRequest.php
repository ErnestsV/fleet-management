<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMaintenanceRecordRequest extends FormRequest
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
            'maintenance_schedule_id' => [
                'nullable',
                'integer',
                Rule::exists('maintenance_schedules', 'id')->when(
                    ! $this->user()?->isSuperAdmin(),
                    fn ($rule) => $rule->where('company_id', $companyId)
                ),
            ],
            'title' => ['required', 'string', 'max:255'],
            'service_date' => ['required', 'date'],
            'odometer_km' => ['nullable', 'numeric', 'min:0'],
            'cost_amount' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
