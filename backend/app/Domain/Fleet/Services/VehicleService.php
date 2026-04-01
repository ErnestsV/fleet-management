<?php

namespace App\Domain\Fleet\Services;

use App\Domain\Fleet\Models\Vehicle;
use App\Models\User;

class VehicleService
{
    public function create(User $actor, array $data): Vehicle
    {
        $companyId = $actor->isSuperAdmin()
            ? $data['company_id']
            : $actor->company_id;

        return Vehicle::create([
            ...$data,
            'company_id' => $companyId,
        ]);
    }

    public function update(Vehicle $vehicle, array $data): Vehicle
    {
        $vehicle->update($data);

        return $vehicle->refresh();
    }

    public function deactivate(Vehicle $vehicle): void
    {
        $vehicle->update(['is_active' => false]);
        $vehicle->delete();
    }
}
