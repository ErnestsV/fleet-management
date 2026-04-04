<?php

namespace App\Domain\Fleet\Services\UserManagement;

use App\Domain\Shared\Enums\UserRole;
use App\Models\User;

class CompanyUserRoleAssignmentGuard
{
    public function assertCanAssign(User $actor, UserRole $role): void
    {
        if (! $actor->isSuperAdmin() && in_array($role, [UserRole::SuperAdmin, UserRole::Owner], true)) {
            abort(403, 'This role cannot be assigned.');
        }
    }
}
