<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicle_states', function (Blueprint $table) {
            $table->json('last_geofence_ids')->nullable()->after('offline_marked_at');
        });
    }

    public function down(): void
    {
        Schema::table('vehicle_states', function (Blueprint $table) {
            $table->dropColumn('last_geofence_ids');
        });
    }
};
