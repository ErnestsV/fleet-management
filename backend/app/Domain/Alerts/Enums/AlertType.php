<?php

namespace App\Domain\Alerts\Enums;

enum AlertType: string
{
    case Speeding = 'speeding';
    case ProlongedIdling = 'prolonged_idling';
    case GeofenceEntry = 'geofence_entry';
    case GeofenceExit = 'geofence_exit';
    case OfflineVehicle = 'offline_vehicle';
    case MaintenanceDue = 'maintenance_due';
    case DriverLicenseExpired = 'driver_license_expired';
    case UnexpectedFuelDrop = 'unexpected_fuel_drop';
    case PossibleFuelTheft = 'possible_fuel_theft';
    case RefuelWithoutTrip = 'refuel_without_trip';
    case AbnormalFuelConsumption = 'abnormal_fuel_consumption';

    /**
     * @return list<self>
     */
    public static function fuelTypes(): array
    {
        return [
            self::UnexpectedFuelDrop,
            self::PossibleFuelTheft,
            self::RefuelWithoutTrip,
            self::AbnormalFuelConsumption,
        ];
    }
}
