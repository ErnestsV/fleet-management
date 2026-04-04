<?php

namespace App\Domain\Fleet\Services;

use App\Domain\Fleet\Services\UserManagement\CreateCompanyUserService;
use App\Domain\Fleet\Services\UserManagement\UpdateCompanyUserService;
use App\Models\User;

class CompanyUserService
{
    public function __construct(
        private readonly CreateCompanyUserService $createCompanyUserService,
        private readonly UpdateCompanyUserService $updateCompanyUserService,
    ) {
    }

    public function create(User $actor, array $data): User
    {
        return $this->createCompanyUserService->handle($actor, $data);
    }

    public function update(User $actor, User $target, array $data): User
    {
        return $this->updateCompanyUserService->handle($actor, $target, $data);
    }
}
