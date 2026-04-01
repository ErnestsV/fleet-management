<?php

namespace Database\Seeders;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Alerts\Models\Alert;
use App\Domain\Alerts\Models\AlertRule;
use App\Domain\Companies\Models\Company;
use App\Domain\Fleet\Models\Driver;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Shared\Enums\UserRole;
use App\Domain\Telemetry\Enums\VehicleStatus;
use App\Domain\Telemetry\Models\DeviceToken;
use App\Domain\Telemetry\Models\VehicleState;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::query()->updateOrCreate([
            'slug' => 'northern-logistics',
        ], [
            'name' => 'Northern Logistics',
            'timezone' => 'Europe/Riga',
            'is_active' => true,
        ]);

        User::updateOrCreate(
            ['email' => 'owner@northern-logistics.test'],
            [
                'company_id' => $company->id,
                'name' => 'Northern Owner',
                'role' => UserRole::Owner,
                'timezone' => $company->timezone,
                'is_active' => true,
                'password' => Hash::make('password'),
            ]
        );

        $vehicles = collect([
            ['name' => 'North 101', 'plate_number' => 'NL-101', 'make' => 'Volvo', 'model' => 'FH', 'year' => 2022, 'device_identifier' => 'demo-device-101'],
            ['name' => 'North 102', 'plate_number' => 'NL-102', 'make' => 'Scania', 'model' => 'R450', 'year' => 2021, 'device_identifier' => 'demo-device-102'],
            ['name' => 'North 103', 'plate_number' => 'NL-103', 'make' => 'MAN', 'model' => 'TGX', 'year' => 2023, 'device_identifier' => 'demo-device-103'],
            ['name' => 'North 104', 'plate_number' => 'NL-104', 'make' => 'DAF', 'model' => 'XG', 'year' => 2020, 'device_identifier' => 'demo-device-104'],
        ])->map(fn (array $vehicleData) => Vehicle::query()->updateOrCreate(
            ['company_id' => $company->id, 'plate_number' => $vehicleData['plate_number']],
            [...$vehicleData, 'company_id' => $company->id, 'is_active' => true]
        ));

        collect([
            ['name' => 'Anna Driver', 'email' => 'anna.driver@northern-logistics.test', 'license_number' => 'DRV-1001'],
            ['name' => 'Mark Driver', 'email' => 'mark.driver@northern-logistics.test', 'license_number' => 'DRV-1002'],
            ['name' => 'Eva Driver', 'email' => 'eva.driver@northern-logistics.test', 'license_number' => 'DRV-1003'],
        ])->each(fn (array $driverData) => Driver::query()->updateOrCreate(
            ['company_id' => $company->id, 'email' => $driverData['email']],
            [...$driverData, 'company_id' => $company->id, 'is_active' => true]
        ));

        AlertRule::query()->updateOrCreate([
            'company_id' => $company->id,
            'type' => AlertType::Speeding,
            'name' => 'Default speed threshold',
        ], [
            'is_enabled' => true,
            'configuration' => ['threshold_kmh' => 90],
        ]);

        foreach ($vehicles as $index => $vehicle) {
            VehicleState::query()->updateOrCreate([
                'vehicle_id' => $vehicle->id,
            ], [
                'company_id' => $company->id,
                'vehicle_id' => $vehicle->id,
                'status' => $index % 2 === 0 ? VehicleStatus::Moving : VehicleStatus::Idling,
                'last_event_at' => now()->subMinutes($index + 1),
                'latitude' => 56.95 + ($index / 100),
                'longitude' => 24.10 + ($index / 100),
                'speed_kmh' => $index % 2 === 0 ? 52 : 0,
                'engine_on' => true,
                'odometer_km' => 182000 + ($index * 250),
                'fuel_level' => 72 - ($index * 4),
            ]);

            DeviceToken::query()->updateOrCreate([
                'vehicle_id' => $vehicle->id,
            ], [
                'company_id' => $company->id,
                'vehicle_id' => $vehicle->id,
                'name' => 'Demo token '.$vehicle->plate_number,
                'token' => hash('sha256', "demo-token-{$vehicle->id}"),
                'is_active' => true,
            ]);
        }

        Alert::query()->updateOrCreate([
            'company_id' => $company->id,
            'vehicle_id' => $vehicles->first()->id,
            'type' => AlertType::Speeding,
        ], [
            'severity' => 'high',
            'message' => 'Vehicle exceeded 90 km/h.',
            'triggered_at' => now()->subMinutes(12),
            'context' => ['speed_kmh' => 96],
        ]);
    }
}
