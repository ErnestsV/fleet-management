<?php

namespace App\Providers;

use App\Domain\Companies\Models\Company;
use App\Domain\Fleet\Models\Driver;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Fleet\Models\VehicleDriverAssignment;
use App\Domain\Geofences\Models\Geofence;
use App\Domain\Maintenance\Models\MaintenanceRecord;
use App\Domain\Maintenance\Models\MaintenanceSchedule;
use App\Domain\Telemetry\Models\VehicleState;
use App\Domain\Trips\Models\Trip;
use App\Models\User;
use App\Policies\AlertPolicy;
use App\Policies\CompanyPolicy;
use App\Policies\DriverPolicy;
use App\Policies\GeofencePolicy;
use App\Policies\MaintenanceRecordPolicy;
use App\Policies\MaintenanceSchedulePolicy;
use App\Policies\TripPolicy;
use App\Policies\UserPolicy;
use App\Policies\VehicleDriverAssignmentPolicy;
use App\Policies\VehiclePolicy;
use App\Policies\VehicleStatePolicy;
use App\Domain\Alerts\Models\Alert;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Company::class => CompanyPolicy::class,
        User::class => UserPolicy::class,
        Vehicle::class => VehiclePolicy::class,
        Driver::class => DriverPolicy::class,
        Alert::class => AlertPolicy::class,
        VehicleState::class => VehicleStatePolicy::class,
        Trip::class => TripPolicy::class,
        VehicleDriverAssignment::class => VehicleDriverAssignmentPolicy::class,
        Geofence::class => GeofencePolicy::class,
        MaintenanceSchedule::class => MaintenanceSchedulePolicy::class,
        MaintenanceRecord::class => MaintenanceRecordPolicy::class,
    ];
}
