<?php

namespace App\Http\Requests;

use App\Domain\Companies\Models\Company;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Company $company */
        $company = $this->route('company');

        return $this->user()?->can('update', $company) ?? false;
    }

    public function rules(): array
    {
        /** @var Company $company */
        $company = $this->route('company');

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('companies', 'slug')->ignore($company->id)],
            'timezone' => ['nullable', 'string', 'max:64'],
            'is_active' => ['boolean'],
            'settings' => ['nullable', 'array'],
            'settings.speed_alert_threshold_kmh' => ['nullable', 'numeric', 'min:1', 'max:300'],
        ];
    }
}
