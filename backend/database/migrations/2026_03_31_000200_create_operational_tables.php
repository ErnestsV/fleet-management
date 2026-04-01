<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->timestamp('start_time')->index();
            $table->timestamp('end_time')->nullable()->index();
            $table->json('start_snapshot')->nullable();
            $table->json('end_snapshot')->nullable();
            $table->decimal('distance_km', 10, 2)->default(0);
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->decimal('average_speed_kmh', 8, 2)->default(0);
            $table->timestamps();
            $table->index(['company_id', 'vehicle_id', 'start_time']);
        });

        Schema::create('geofences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('type');
            $table->json('geometry');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('alert_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('type')->index();
            $table->string('name');
            $table->boolean('is_enabled')->default(true);
            $table->json('configuration')->nullable();
            $table->timestamps();
        });

        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vehicle_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('alert_rule_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type')->index();
            $table->string('severity')->default('medium');
            $table->string('message');
            $table->json('context')->nullable();
            $table->timestamp('triggered_at')->index();
            $table->timestamp('resolved_at')->nullable()->index();
            $table->timestamps();
        });

        Schema::create('maintenance_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedInteger('interval_days')->nullable();
            $table->decimal('interval_km', 10, 2)->nullable();
            $table->date('next_due_date')->nullable()->index();
            $table->decimal('next_due_odometer_km', 10, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('maintenance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->foreignId('maintenance_schedule_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->date('service_date');
            $table->decimal('odometer_km', 10, 2)->nullable();
            $table->decimal('cost_amount', 10, 2)->nullable();
            $table->string('currency', 3)->default('EUR');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_records');
        Schema::dropIfExists('maintenance_schedules');
        Schema::dropIfExists('alerts');
        Schema::dropIfExists('alert_rules');
        Schema::dropIfExists('geofences');
        Schema::dropIfExists('trips');
    }
};
