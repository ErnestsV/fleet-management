<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_job_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('job_key')->unique();
            $table->string('label');
            $table->string('frequency');
            $table->unsignedInteger('expected_interval_minutes')->nullable();
            $table->string('status')->default('unknown');
            $table->timestamp('last_started_at')->nullable();
            $table->timestamp('last_finished_at')->nullable();
            $table->timestamp('last_succeeded_at')->nullable();
            $table->timestamp('last_failed_at')->nullable();
            $table->text('last_error')->nullable();
            $table->unsignedInteger('last_runtime_ms')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_job_statuses');
    }
};
