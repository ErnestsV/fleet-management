<?php

namespace App\Policies;

use App\Domain\Companies\Models\Company;
use App\Models\User;

class CompanyPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin();
    }

    public function view(User $user, Company $company): bool
    {
        /** @var int|null $userCompanyId */
        $userCompanyId = $user->company_id;

        return $user->isSuperAdmin() || $userCompanyId === $company->getKey();
    }

    public function create(User $user): bool
    {
        return $user->isSuperAdmin();
    }

    public function update(User $user, Company $company): bool
    {
        /** @var int|null $userCompanyId */
        $userCompanyId = $user->company_id;
        $canManageUsers = ($user->role?->canManageUsers()) ?? false;

        return $user->isSuperAdmin()
            || (
                $userCompanyId === $company->getKey()
                && $canManageUsers
            );
    }

    public function delete(User $user, Company $company): bool
    {
        return $user->isSuperAdmin();
    }
}
