<?php

namespace App\Domain\Companies\Services;

use App\Domain\Companies\Models\Company;
use App\Domain\Shared\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CompanyService
{
    public function createCompanyWithOwner(array $companyData, ?array $ownerData = null): Company
    {
        return DB::transaction(function () use ($companyData, $ownerData) {
            $company = Company::create([
                ...$companyData,
                'slug' => $companyData['slug'] ?? Str::slug($companyData['name']).'-'.Str::lower(Str::random(5)),
            ]);

            if ($ownerData) {
                User::create([
                    'company_id' => $company->id,
                    'name' => $ownerData['name'],
                    'email' => $ownerData['email'],
                    'role' => $ownerData['role'] ?? UserRole::Owner,
                    'timezone' => $ownerData['timezone'] ?? $company->timezone,
                    'is_active' => true,
                    'password' => Hash::make($ownerData['password'] ?? Str::password(16)),
                ]);
            }

            return $company;
        });
    }

    public function updateCompany(Company $company, array $data): Company
    {
        $company->update([
            'name' => $data['name'],
            'slug' => $data['slug'] ?? $company->slug,
            'timezone' => $data['timezone'] ?? $company->timezone,
            'settings' => $data['settings'] ?? $company->settings,
            'is_active' => $data['is_active'] ?? $company->is_active,
        ]);

        return $company->refresh();
    }
}
