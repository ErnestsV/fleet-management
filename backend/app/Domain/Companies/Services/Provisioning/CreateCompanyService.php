<?php

namespace App\Domain\Companies\Services\Provisioning;

use App\Domain\Auth\Services\AccountInvitationService;
use App\Domain\Companies\Models\Company;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CreateCompanyService
{
    public function __construct(
        private readonly CompanyPayloadBuilder $companyPayloadBuilder,
        private readonly CompanyOwnerPayloadBuilder $companyOwnerPayloadBuilder,
        private readonly AccountInvitationService $accountInvitationService,
    ) {
    }

    public function handle(array $companyData, ?array $ownerData = null): Company
    {
        [$company, $owner] = DB::transaction(function () use ($companyData, $ownerData) {
            $company = Company::create($this->companyPayloadBuilder->buildCreatePayload($companyData));

            $owner = null;

            if ($ownerData) {
                $owner = User::create($this->companyOwnerPayloadBuilder->build($company, $ownerData));
            }

            return [$company, $owner];
        });

        if ($owner) {
            $this->accountInvitationService->sendPasswordSetupLink($owner);
        }

        return $company;
    }
}
