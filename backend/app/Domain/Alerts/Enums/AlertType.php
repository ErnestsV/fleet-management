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
}
