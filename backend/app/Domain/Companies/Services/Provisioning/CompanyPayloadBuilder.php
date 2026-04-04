<?php

namespace App\Domain\Companies\Services\Provisioning;

use App\Domain\Companies\Models\Company;
use Illuminate\Support\Str;

class CompanyPayloadBuilder
{
    public function buildCreatePayload(array $companyData): array
    {
        return [
            ...$companyData,
            'slug' => $companyData['slug'] ?? Str::slug($companyData['name']).'-'.Str::lower(Str::random(5)),
        ];
    }

    public function buildUpdatePayload(Company $company, array $data): array
    {
        return [
            'name' => $data['name'],
            'slug' => $data['slug'] ?? $company->slug,
            'timezone' => $data['timezone'] ?? $company->timezone,
            'settings' => $data['settings'] ?? $company->settings,
            'is_active' => $data['is_active'] ?? $company->is_active,
        ];
    }
}
