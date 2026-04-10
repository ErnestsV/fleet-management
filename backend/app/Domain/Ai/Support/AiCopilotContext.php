<?php

namespace App\Domain\Ai\Support;

class AiCopilotContext
{
    public const DASHBOARD = 'dashboard';
    public const DRIVER_INSIGHTS = 'driver_insights';
    public const FUEL_INSIGHTS = 'fuel_insights';
    public const TELEMETRY_HEALTH = 'telemetry_health';
    public const GEOFENCE_ANALYTICS = 'geofence_analytics';
    public const ALERTS = 'alerts';
    public const MAINTENANCE = 'maintenance';
    public const TRIPS = 'trips';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return [
            self::DASHBOARD,
            self::DRIVER_INSIGHTS,
            self::FUEL_INSIGHTS,
            self::TELEMETRY_HEALTH,
            self::GEOFENCE_ANALYTICS,
            self::ALERTS,
            self::MAINTENANCE,
            self::TRIPS,
        ];
    }
}
