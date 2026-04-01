<?php

namespace App\Console\Commands;

use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Telemetry\Services\TelemetryIngestionService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class SimulateTelemetryCommand extends Command
{
    protected $signature = 'app:simulate-telemetry {--vehicle=} {--count=10}';

    protected $description = 'Generate fake telemetry events for demo vehicles.';

    public function handle(TelemetryIngestionService $service): int
    {
        $vehicles = Vehicle::query()
            ->when($this->option('vehicle'), fn ($query, $vehicleId) => $query->whereKey($vehicleId))
            ->limit(5)
            ->get();

        foreach ($vehicles as $vehicle) {
            for ($i = 0; $i < (int) $this->option('count'); $i++) {
                $service->ingest($vehicle, [
                    'timestamp' => Carbon::now()->subMinutes(((int) $this->option('count')) - $i),
                    'latitude' => 56.9496 + fake()->randomFloat(6, -0.05, 0.05),
                    'longitude' => 24.1052 + fake()->randomFloat(6, -0.05, 0.05),
                    'speed_kmh' => fake()->randomElement([0, 0, 12, 36, 58, 92]),
                    'engine_on' => fake()->boolean(80),
                    'odometer_km' => fake()->randomFloat(2, 12000, 240000),
                    'fuel_level' => fake()->randomFloat(2, 10, 95),
                    'heading' => fake()->numberBetween(0, 359),
                ]);
            }
        }

        $this->info('Telemetry simulation complete.');

        return self::SUCCESS;
    }
}
