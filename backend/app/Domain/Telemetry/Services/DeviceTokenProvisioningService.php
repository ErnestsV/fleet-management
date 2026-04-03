<?php

namespace App\Domain\Telemetry\Services;

use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Telemetry\Models\DeviceToken;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DeviceTokenProvisioningService
{
    public function issueForVehicle(Vehicle $vehicle): string
    {
        return DB::transaction(function () use ($vehicle): string {
            $plainToken = 'vcl_'.Str::random(48);

            Vehicle::query()
                ->whereKey($vehicle->id)
                ->lockForUpdate()
                ->firstOrFail();

            DeviceToken::query()
                ->where('vehicle_id', $vehicle->id)
                ->update(['is_active' => false]);

            $deviceToken = DeviceToken::query()
                ->where('vehicle_id', $vehicle->id)
                ->orderByDesc('id')
                ->first() ?? new DeviceToken();

            $deviceToken->fill([
                'company_id' => $vehicle->company_id,
                'vehicle_id' => $vehicle->id,
                'name' => DeviceToken::DEFAULT_NAME,
                'token' => hash('sha256', $plainToken),
                'last_used_at' => null,
                'is_active' => true,
            ]);
            $deviceToken->save();

            return $plainToken;
        });
    }

    public function deactivateForVehicle(Vehicle $vehicle): void
    {
        DB::transaction(function () use ($vehicle): void {
            Vehicle::query()
                ->whereKey($vehicle->id)
                ->lockForUpdate()
                ->firstOrFail();

            DeviceToken::query()
                ->where('vehicle_id', $vehicle->id)
                ->update(['is_active' => false]);
        });
    }
}
