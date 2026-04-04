<?php

namespace App\Http\Requests;

use App\Domain\Maintenance\Models\MaintenanceSchedule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMaintenanceScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var MaintenanceSchedule $schedule */
        $schedule = $this->route('maintenanceSchedule');

        return $this->user()?->can('update', $schedule) ?? false;
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
