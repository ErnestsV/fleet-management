<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('telemetry_ingestion_keys', function (Blueprint $table) {
            $table->string('ingestion_key', 64)->primary();
            $table->unsignedBigInteger('telemetry_event_id')->nullable();
            $table->timestamps();
        });

        if (Schema::hasTable('telemetry_events')) {
            DB::table('telemetry_events')
                ->select('ingestion_key')
                ->selectRaw('MIN(id) as telemetry_event_id')
                ->whereNotNull('ingestion_key')
                ->groupBy('ingestion_key')
                ->orderBy('ingestion_key')
                ->chunk(500, function ($rows): void {
                    $payload = collect($rows)
                        ->map(fn (object $row) => [
                            'ingestion_key' => $row->ingestion_key,
                            'telemetry_event_id' => (int) $row->telemetry_event_id,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ])
                        ->all();

                    if ($payload !== []) {
                        DB::table('telemetry_ingestion_keys')->insertOrIgnore($payload);
                    }
                });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('telemetry_ingestion_keys');
    }
};
