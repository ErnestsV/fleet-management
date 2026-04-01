<?php

namespace App\Domain\Fleet\Services;

use App\Domain\Fleet\Models\Driver;
use App\Models\User;

class DriverService
{
    public function create(User $actor, array $data): Driver
    {
        $companyId = $actor->isSuperAdmin()
            ? $data['company_id']
            : $actor->company_id;

        return Driver::create([
            ...$data,
            'company_id' => $companyId,
        ]);
    }

    public function update(Driver $driver, array $data): Driver
    {
        $driver->update($data);

        return $driver->refresh();
    }

    public function deactivate(Driver $driver): void
    {
        $driver->update(['is_active' => false]);
        $driver->delete();
    }
}
