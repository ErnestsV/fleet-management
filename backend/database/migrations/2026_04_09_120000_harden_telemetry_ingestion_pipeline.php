<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('telemetry_events', function (Blueprint $table) {
            $table->string('message_id', 120)->nullable()->after('vehicle_id');
            $table->string('ingestion_key', 64)->nullable()->after('message_id');
            $table->timestamp('processing_started_at')->nullable()->after('payload');
            $table->timestamp('processed_at')->nullable()->after('processing_started_at');
            $table->text('processing_error')->nullable()->after('processed_at');
        });

        Schema::table('telemetry_events', function (Blueprint $table) {
            $table->unique('ingestion_key', 'telemetry_events_ingestion_key_unique');
            $table->index(['company_id', 'vehicle_id', 'processed_at', 'occurred_at'], 'telemetry_events_company_vehicle_processed_occurred_idx');
            $table->index(['processed_at', 'occurred_at'], 'telemetry_events_processed_occurred_idx');
        });

        Schema::table('vehicle_states', function (Blueprint $table) {
            $table->index(['company_id', 'last_event_at'], 'vehicle_states_company_last_event_at_idx');
        });

        Schema::table('device_tokens', function (Blueprint $table) {
            $table->index(['vehicle_id', 'is_active'], 'device_tokens_vehicle_active_idx');
            $table->index(['company_id', 'is_active', 'last_used_at'], 'device_tokens_company_active_last_used_idx');
        });
    }

    public function down(): void
    {
        Schema::table('device_tokens', function (Blueprint $table) {
            $table->dropIndex('device_tokens_vehicle_active_idx');
            $table->dropIndex('device_tokens_company_active_last_used_idx');
        });

        Schema::table('vehicle_states', function (Blueprint $table) {
            $table->dropIndex('vehicle_states_company_last_event_at_idx');
        });

        Schema::table('telemetry_events', function (Blueprint $table) {
            $table->dropIndex('telemetry_events_company_vehicle_processed_occurred_idx');
            $table->dropIndex('telemetry_events_processed_occurred_idx');
            $table->dropUnique('telemetry_events_ingestion_key_unique');
            $table->dropColumn([
                'message_id',
                'ingestion_key',
                'processing_started_at',
                'processed_at',
                'processing_error',
            ]);
        });
    }
};
