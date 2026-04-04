<?php

namespace App\Domain\Companies\Services\Provisioning;

use App\Domain\Companies\Models\Company;

class UpdateCompanyService
{
    public function __construct(
        private readonly CompanyPayloadBuilder $companyPayloadBuilder,
    ) {
    }

    public function handle(Company $company, array $data): Company
    {
        $company->update($this->companyPayloadBuilder->buildUpdatePayload($company, $data));

        return $company->refresh();
    }
}
