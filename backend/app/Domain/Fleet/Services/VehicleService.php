<?php

namespace App\Domain\Fleet\Services;

use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Telemetry\Services\DeviceTokenProvisioningService;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class VehicleService
{
    public function __construct(
        private readonly DeviceTokenProvisioningService $deviceTokenProvisioningService,
    ) {
    }

    public function create(User $actor, array $data): array
    {
        return DB::transaction(function () use ($actor, $data): array {
            $companyId = $actor->isSuperAdmin()
                ? $data['company_id']
                : $actor->company_id;

            $this->releaseArchivedPlateNumber(
                companyId: $companyId,
                plateNumber: (string) $data['plate_number'],
            );

            $vehicle = Vehicle::create([
                ...$data,
                'company_id' => $companyId,
            ]);

            $plainToken = $this->deviceTokenProvisioningService->issueForVehicle($vehicle);

            return [$vehicle->fresh('activeDeviceToken'), $plainToken];
        });
    }

    public function update(Vehicle $vehicle, array $data): Vehicle
    {
        return DB::transaction(function () use ($vehicle, $data): Vehicle {
            if (array_key_exists('plate_number', $data) && $data['plate_number'] !== $vehicle->plate_number) {
                $this->releaseArchivedPlateNumber(
                    companyId: $vehicle->company_id,
                    plateNumber: (string) $data['plate_number'],
                );
            }

            $vehicle->update($data);

            return $vehicle->refresh();
        });
    }

    public function deactivate(Vehicle $vehicle): void
    {
        DB::transaction(function () use ($vehicle): void {
            $lockedVehicle = Vehicle::query()
                ->whereKey($vehicle->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->deviceTokenProvisioningService->deactivateForVehicle($lockedVehicle);

            $lockedVehicle->update([
                'is_active' => false,
                // Free the original plate number for future reuse while preserving an archive trail on the soft-deleted row.
                'plate_number' => sprintf('%s__archived__%d', $lockedVehicle->plate_number, $lockedVehicle->id),
            ]);
            $lockedVehicle->delete();
        });
    }

    public function rotateDeviceToken(Vehicle $vehicle): array
    {
        $plainToken = $this->deviceTokenProvisioningService->issueForVehicle($vehicle);

        return [$vehicle->fresh('activeDeviceToken'), $plainToken];
    }

    private function releaseArchivedPlateNumber(int $companyId, string $plateNumber): void
    {
        Vehicle::onlyTrashed()
            ->where('company_id', $companyId)
            ->where('plate_number', $plateNumber)
            ->get()
            ->each(function (Vehicle $vehicle): void {
                $vehicle->forceFill([
                    'plate_number' => sprintf('%s__archived__%d', $vehicle->plate_number, $vehicle->id),
                ])->save();
            });
    }
}
