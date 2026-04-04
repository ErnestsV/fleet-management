<?php

namespace App\Domain\Fleet\Services\UserManagement;

use App\Domain\Auth\Services\AccountInvitationService;
use App\Models\User;

class CreateCompanyUserService
{
    public function __construct(
        private readonly CompanyUserPayloadBuilder $payloadBuilder,
        private readonly CompanyUserRoleAssignmentGuard $roleAssignmentGuard,
        private readonly AccountInvitationService $accountInvitationService,
    ) {
    }

    public function handle(User $actor, array $data): User
    {
        $payload = $this->payloadBuilder->buildCreatePayload($actor, $data);
        $this->roleAssignmentGuard->assertCanAssign($actor, $payload['role']);

        $user = User::create($payload);

        $this->accountInvitationService->sendPasswordSetupLink($user);

        return $user;
    }
}
