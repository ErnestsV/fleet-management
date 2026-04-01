<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\CompanyUserController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\GeofenceController;
use App\Http\Controllers\Api\MaintenanceRecordController;
use App\Http\Controllers\Api\MaintenanceScheduleController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\TelemetryIngestionController;
use App\Http\Controllers\Api\TripController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\VehicleDriverAssignmentController;
use App\Http\Controllers\Api\VehicleStateController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::middleware('throttle:login')->group(function () {
        Route::post('/auth/login', [AuthController::class, 'login']);
        Route::post('/auth/forgot-password', [PasswordResetController::class, 'forgotPassword']);
        Route::post('/auth/reset-password', [PasswordResetController::class, 'resetPassword']);
    });

    Route::post('/telemetry/events', [TelemetryIngestionController::class, 'store'])
        ->middleware('throttle:telemetry');

    Route::middleware(['auth:sanctum', 'active.account'])->group(function () {
        Route::get('/auth/user', [ProfileController::class, 'show']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::patch('/auth/profile', [ProfileController::class, 'update']);
        Route::post('/auth/change-password', [ProfileController::class, 'changePassword']);

        Route::get('/dashboard/summary', DashboardController::class);
        Route::apiResource('companies', CompanyController::class)->only(['index', 'store', 'update']);
        Route::apiResource('users', CompanyUserController::class)->only(['index', 'store', 'update']);
        Route::apiResource('vehicles', VehicleController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
        Route::apiResource('drivers', DriverController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
        Route::apiResource('trips', TripController::class)->only(['index', 'show']);
        Route::get('/vehicles/{vehicle}/trips', [TripController::class, 'vehicleHistory']);
        Route::get('/vehicle-driver-assignments', [VehicleDriverAssignmentController::class, 'index']);
        Route::post('/vehicle-driver-assignments', [VehicleDriverAssignmentController::class, 'store']);
        Route::post('/vehicle-driver-assignments/{vehicleDriverAssignment}/end', [VehicleDriverAssignmentController::class, 'end']);
        Route::apiResource('geofences', GeofenceController::class);
        Route::apiResource('maintenance-schedules', MaintenanceScheduleController::class)->except(['show']);
        Route::get('/maintenance-upcoming', [MaintenanceScheduleController::class, 'upcoming']);
        Route::apiResource('maintenance-records', MaintenanceRecordController::class)->except(['show']);
        Route::get('/alerts', [AlertController::class, 'index']);
        Route::get('/vehicle-states', VehicleStateController::class);
    });
});
