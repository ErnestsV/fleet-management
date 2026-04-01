<?php

namespace Tests\Unit;

use App\Domain\Telemetry\Enums\VehicleStatus;
use App\Domain\Telemetry\Models\TelemetryEvent;
use App\Domain\Telemetry\Services\TelemetryStateResolver;
use PHPUnit\Framework\TestCase;

class TelemetryStateResolverTest extends TestCase
{
    public function test_resolves_moving_status(): void
    {
        $event = new TelemetryEvent([
            'engine_on' => true,
            'speed_kmh' => 10,
        ]);

        $resolver = new TelemetryStateResolver();

        $this->assertSame(VehicleStatus::Moving, $resolver->resolveStatus($event));
    }
}
