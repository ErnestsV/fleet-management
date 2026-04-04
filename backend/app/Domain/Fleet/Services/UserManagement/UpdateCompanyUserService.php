<?php

namespace App\Domain\Fleet\Services\UserManagement;

use App\Models\User;
use Illuminate\Support\Facades\DB;

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

        DB::transaction(function () use ($target, $payload, $data): void {
            $target->update($payload);

            if (! empty($data['password'])) {
                $target->tokens()->delete();
            }
        });

        return $target->refresh();
    }
}
