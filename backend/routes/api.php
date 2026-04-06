<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\CompanyUserController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\DriverInsightsController;
use App\Http\Controllers\Api\FuelInsightsController;
use App\Http\Controllers\Api\GeofenceAnalyticsController;
use App\Http\Controllers\Api\GeofenceController;
use App\Http\Controllers\Api\MaintenanceRecordController;
use App\Http\Controllers\Api\MaintenanceScheduleController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\TelemetryIngestionController;
use App\Http\Controllers\Api\TelemetryHealthController;
use App\Http\Controllers\Api\TripController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\VehicleDriverAssignmentController;
use App\Http\Controllers\Api\VehicleStateController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login'])
        ->middleware('throttle:login');

    Route::post('/auth/forgot-password', [PasswordResetController::class, 'forgotPassword'])
        ->middleware('throttle:forgot-password');

    Route::post('/auth/reset-password', [PasswordResetController::class, 'resetPassword'])
        ->middleware('throttle:reset-password');

    Route::post('/telemetry/events', [TelemetryIngestionController::class, 'store'])
        ->middleware('throttle:telemetry');

    Route::middleware(['auth:sanctum', 'active.account'])->group(function () {
        Route::get('/auth/user', [ProfileController::class, 'show'])
            ->middleware('throttle:api-read');
        Route::post('/auth/logout', [AuthController::class, 'logout'])
            ->middleware('throttle:api-mutate');
        Route::patch('/auth/profile', [ProfileController::class, 'update'])
            ->middleware('throttle:api-mutate');
        Route::post('/auth/change-password', [ProfileController::class, 'changePassword'])
            ->middleware('throttle:api-mutate');

        Route::get('/dashboard/summary', DashboardController::class)
            ->middleware('throttle:api-read');
        Route::get('/telemetry-health', TelemetryHealthController::class)
            ->middleware('throttle:api-read');
        Route::get('/driver-insights', DriverInsightsController::class)
            ->middleware('throttle:api-read');
        Route::get('/fuel-insights', FuelInsightsController::class)
            ->middleware('throttle:api-read');
        Route::get('/geofence-analytics', GeofenceAnalyticsController::class)
            ->middleware('throttle:api-read');
        Route::apiResource('companies', CompanyController::class)
            ->only(['index', 'store', 'update'])
            ->middleware([
                'index' => 'throttle:api-read',
                'store' => 'throttle:api-mutate',
                'update' => 'throttle:api-mutate',
            ]);
        Route::apiResource('users', CompanyUserController::class)
            ->only(['index', 'store', 'update'])
            ->middleware([
                'index' => 'throttle:api-read',
                'store' => 'throttle:api-mutate',
                'update' => 'throttle:api-mutate',
            ]);
        Route::apiResource('vehicles', VehicleController::class)
            ->only(['index', 'store', 'show', 'update', 'destroy'])
            ->middleware([
                'index' => 'throttle:api-read',
                'show' => 'throttle:api-read',
                'store' => 'throttle:api-mutate',
                'update' => 'throttle:api-mutate',
                'destroy' => 'throttle:api-mutate',
            ]);
        Route::post('/vehicles/{vehicle}/device-token/rotate', [VehicleController::class, 'rotateDeviceToken'])
            ->middleware('throttle:api-mutate');
        Route::apiResource('drivers', DriverController::class)
            ->only(['index', 'store', 'show', 'update', 'destroy'])
            ->middleware([
                'index' => 'throttle:api-read',
                'show' => 'throttle:api-read',
                'store' => 'throttle:api-mutate',
                'update' => 'throttle:api-mutate',
                'destroy' => 'throttle:api-mutate',
            ]);
        Route::apiResource('trips', TripController::class)
            ->only(['index', 'show'])
            ->middleware([
                'index' => 'throttle:api-read',
                'show' => 'throttle:api-read',
            ]);
        Route::get('/vehicles/{vehicle}/trips', [TripController::class, 'vehicleHistory'])
            ->middleware('throttle:api-read');
        Route::get('/vehicle-driver-assignments', [VehicleDriverAssignmentController::class, 'index'])
            ->middleware('throttle:api-read');
        Route::post('/vehicle-driver-assignments', [VehicleDriverAssignmentController::class, 'store'])
            ->middleware('throttle:api-mutate');
        Route::post('/vehicle-driver-assignments/{vehicleDriverAssignment}/end', [VehicleDriverAssignmentController::class, 'end'])
            ->middleware('throttle:api-mutate');
        Route::apiResource('geofences', GeofenceController::class)
            ->middleware([
                'index' => 'throttle:api-read',
                'show' => 'throttle:api-read',
                'store' => 'throttle:api-mutate',
                'update' => 'throttle:api-mutate',
                'destroy' => 'throttle:api-mutate',
            ]);
        Route::apiResource('maintenance-schedules', MaintenanceScheduleController::class)
            ->except(['show'])
            ->middleware([
                'index' => 'throttle:api-read',
                'store' => 'throttle:api-mutate',
                'update' => 'throttle:api-mutate',
                'destroy' => 'throttle:api-mutate',
            ]);
        Route::get('/maintenance-upcoming', [MaintenanceScheduleController::class, 'upcoming'])
            ->middleware('throttle:api-read');
        Route::apiResource('maintenance-records', MaintenanceRecordController::class)
            ->except(['show'])
            ->middleware([
                'index' => 'throttle:api-read',
                'store' => 'throttle:api-mutate',
                'update' => 'throttle:api-mutate',
                'destroy' => 'throttle:api-mutate',
            ]);
        Route::get('/alerts', [AlertController::class, 'index'])
            ->middleware('throttle:api-read');
        Route::post('/alerts/{alert}/resolve', [AlertController::class, 'resolve'])
            ->middleware('throttle:api-mutate');
        Route::get('/vehicle-states', VehicleStateController::class)
            ->middleware('throttle:api-read');
    });
});
