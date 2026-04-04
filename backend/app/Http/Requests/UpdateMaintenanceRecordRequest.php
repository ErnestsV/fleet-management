<?php

namespace App\Http\Requests;

use App\Domain\Maintenance\Models\MaintenanceRecord;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMaintenanceRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var MaintenanceRecord $record */
        $record = $this->route('maintenanceRecord') ?? $this->route('maintenance_record');

        return $this->user()?->can('update', $record) ?? false;
    }

    public function rules(): array
    {
        /** @var MaintenanceRecord $record */
        $record = $this->route('maintenanceRecord') ?? $this->route('maintenance_record');
        $companyId = $this->user()?->isSuperAdmin()
            ? ($this->integer('company_id') ?: $record->company_id)
            : $this->user()?->company_id;
        $vehicleId = (int) $this->input('vehicle_id');

        return [
            'company_id' => [
                'nullable',
                'integer',
                Rule::exists('companies', 'id')->when(
                    ! $this->user()?->isSuperAdmin(),
                    fn ($rule) => $rule->where('id', $companyId)
                ),
            ],
            'vehicle_id' => [
                'required',
                'integer',
                Rule::exists('vehicles', 'id')->when(
                    $companyId !== null,
                    fn ($rule) => $rule->where('company_id', $companyId)
                ),
            ],
            'maintenance_schedule_id' => [
                'nullable',
                'integer',
                Rule::exists('maintenance_schedules', 'id')->when(
                    $companyId !== null,
                    fn ($rule) => $rule->where('company_id', $companyId)
                )->when(
                    $vehicleId > 0,
                    fn ($rule) => $rule->where('vehicle_id', $vehicleId)
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
