<?php

namespace App\Domain\Fleet\Data;

use App\Domain\Fleet\Models\Vehicle;

readonly class ProvisionedVehicleResult
{
    public function __construct(
        public Vehicle $vehicle,
        public string $plainToken,
    ) {
    }
}
