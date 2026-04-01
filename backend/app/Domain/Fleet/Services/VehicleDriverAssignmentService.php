<?php

namespace App\Domain\Fleet\Services;

use App\Domain\Fleet\Models\Driver;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Fleet\Models\VehicleDriverAssignment;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VehicleDriverAssignmentService
{
    public function assign(Vehicle $vehicle, Driver $driver, array $data): VehicleDriverAssignment
    {
        if ($vehicle->company_id !== $driver->company_id) {
            throw ValidationException::withMessages([
                'driver_id' => ['The selected driver must belong to the same company as the vehicle.'],
            ]);
        }

        return DB::transaction(function () use ($vehicle, $driver, $data) {
            VehicleDriverAssignment::query()
                ->where('company_id', $vehicle->company_id)
                ->where(function ($query) use ($vehicle, $driver) {
                    $query->where('vehicle_id', $vehicle->id)
                        ->orWhere('driver_id', $driver->id);
                })
                ->whereNull('assigned_until')
                ->update(['assigned_until' => $data['assigned_from']]);

            return VehicleDriverAssignment::create([
                'company_id' => $vehicle->company_id,
                'vehicle_id' => $vehicle->id,
                'driver_id' => $driver->id,
                'assigned_from' => $data['assigned_from'],
                'assigned_until' => $data['assigned_until'] ?? null,
            ]);
        });
    }

    public function end(VehicleDriverAssignment $assignment, string $endedAt): VehicleDriverAssignment
    {
        $assignment->update([
            'assigned_until' => $endedAt,
        ]);

        return $assignment->refresh();
    }
}
