<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('telemetry_events', function (Blueprint $table) {
            $table->index(['vehicle_id', 'occurred_at'], 'telemetry_events_vehicle_occurred_at_idx');
        });

        Schema::table('alerts', function (Blueprint $table) {
            $table->index(['company_id', 'resolved_at', 'type', 'triggered_at'], 'alerts_company_resolved_type_triggered_idx');
            $table->index(['company_id', 'vehicle_id', 'type', 'resolved_at'], 'alerts_company_vehicle_type_resolved_idx');
            $table->index(['company_id', 'type', 'triggered_at'], 'alerts_company_type_triggered_idx');
        });

        Schema::table('trips', function (Blueprint $table) {
            $table->index(['vehicle_id', 'end_time', 'start_time'], 'trips_vehicle_end_start_idx');
            $table->index(['vehicle_id', 'start_time'], 'trips_vehicle_start_idx');
        });

        Schema::table('vehicle_driver_assignments', function (Blueprint $table) {
            $table->index(['company_id', 'driver_id'], 'assignments_company_driver_idx');
            $table->index(['company_id', 'vehicle_id', 'assigned_until', 'assigned_from'], 'assignments_company_vehicle_window_idx');
            $table->index(['company_id', 'driver_id', 'assigned_until', 'assigned_from'], 'assignments_company_driver_window_idx');
        });
    }

    public function down(): void
    {
        Schema::table('vehicle_driver_assignments', function (Blueprint $table) {
            $table->dropIndex('assignments_company_driver_idx');
            $table->dropIndex('assignments_company_vehicle_window_idx');
            $table->dropIndex('assignments_company_driver_window_idx');
        });

        Schema::table('trips', function (Blueprint $table) {
            $table->dropIndex('trips_vehicle_end_start_idx');
            $table->dropIndex('trips_vehicle_start_idx');
        });

        Schema::table('alerts', function (Blueprint $table) {
            $table->dropIndex('alerts_company_resolved_type_triggered_idx');
            $table->dropIndex('alerts_company_vehicle_type_resolved_idx');
            $table->dropIndex('alerts_company_type_triggered_idx');
        });

        Schema::table('telemetry_events', function (Blueprint $table) {
            $table->dropIndex('telemetry_events_vehicle_occurred_at_idx');
        });
    }
};
