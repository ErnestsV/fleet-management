<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('plate_number');
            $table->string('vin')->nullable();
            $table->string('make')->nullable();
            $table->string('model')->nullable();
            $table->unsignedSmallInteger('year')->nullable();
            $table->string('device_identifier')->nullable()->index();
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();
            $table->unique(['company_id', 'plate_number']);
        });

        Schema::create('drivers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('license_number')->nullable();
            $table->timestamp('license_expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('vehicle_driver_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->foreignId('driver_id')->constrained()->cascadeOnDelete();
            $table->timestamp('assigned_from');
            $table->timestamp('assigned_until')->nullable();
            $table->timestamps();
            $table->index(['company_id', 'vehicle_id']);
        });

        Schema::create('telemetry_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->timestamp('occurred_at')->index();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->decimal('speed_kmh', 8, 2)->default(0);
            $table->boolean('engine_on')->default(false);
            $table->decimal('odometer_km', 12, 2)->nullable();
            $table->decimal('fuel_level', 5, 2)->nullable();
            $table->decimal('heading', 8, 2)->nullable();
            $table->json('payload')->nullable();
            $table->timestamps();
            $table->index(['company_id', 'vehicle_id', 'occurred_at']);
        });

        Schema::create('vehicle_states', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vehicle_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('status')->index();
            $table->timestamp('last_event_at')->nullable()->index();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->decimal('speed_kmh', 8, 2)->nullable();
            $table->boolean('engine_on')->nullable();
            $table->decimal('odometer_km', 12, 2)->nullable();
            $table->decimal('fuel_level', 5, 2)->nullable();
            $table->decimal('heading', 8, 2)->nullable();
            $table->timestamp('moving_started_at')->nullable();
            $table->timestamp('idling_started_at')->nullable();
            $table->timestamp('stopped_started_at')->nullable();
            $table->timestamp('offline_marked_at')->nullable();
            $table->timestamps();
        });

        Schema::create('device_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('token')->unique();
            $table->timestamp('last_used_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_tokens');
        Schema::dropIfExists('vehicle_states');
        Schema::dropIfExists('telemetry_events');
        Schema::dropIfExists('vehicle_driver_assignments');
        Schema::dropIfExists('drivers');
        Schema::dropIfExists('vehicles');
    }
};
