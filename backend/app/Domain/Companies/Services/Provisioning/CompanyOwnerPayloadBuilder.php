<?php

namespace App\Domain\Companies\Services\Provisioning;

use App\Domain\Companies\Models\Company;
use App\Domain\Shared\Enums\UserRole;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CompanyOwnerPayloadBuilder
{
    public function build(Company $company, array $ownerData): array
    {
        return [
            'company_id' => $company->id,
            'name' => $ownerData['name'],
            'email' => $ownerData['email'],
            'role' => $ownerData['role'] ?? UserRole::Owner,
            'timezone' => $ownerData['timezone'] ?? $company->timezone,
            'is_active' => true,
            'password' => Hash::make($ownerData['password'] ?? Str::password(16)),
        ];
    }
}
