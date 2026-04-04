<?php

namespace App\Domain\Companies\Services;

use App\Domain\Companies\Models\Company;
use App\Domain\Companies\Services\Provisioning\CreateCompanyService;
use App\Domain\Companies\Services\Provisioning\UpdateCompanyService;

class CompanyService
{
    public function __construct(
        private readonly CreateCompanyService $createCompanyService,
        private readonly UpdateCompanyService $updateCompanyService,
    ) {
    }

    public function createCompanyWithOwner(array $companyData, ?array $ownerData = null): Company
    {
        return $this->createCompanyService->handle($companyData, $ownerData);
    }

    public function updateCompany(Company $company, array $data): Company
    {
        return $this->updateCompanyService->handle($company, $data);
    }
}
