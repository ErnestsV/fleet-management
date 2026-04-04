<?php

namespace App\Domain\Fleet\Services\UserManagement;

use App\Models\User;

class UpdateCompanyUserService
{
    public function __construct(
        private readonly CompanyUserPayloadBuilder $payloadBuilder,
        private readonly CompanyUserRoleAssignmentGuard $roleAssignmentGuard,
    ) {
    }

    public function handle(User $actor, User $target, array $data): User
    {
        $payload = $this->payloadBuilder->buildUpdatePayload($target, $data);
        $this->roleAssignmentGuard->assertCanAssign($actor, $payload['role']);

        $target->update($payload);

        return $target->refresh();
    }
}
