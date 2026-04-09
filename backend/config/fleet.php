<?php

return [
    'speed_alert_threshold_kmh' => (float) env('FLEET_SPEED_ALERT_THRESHOLD_KMH', 90),
    'offline_threshold_minutes' => (int) env('FLEET_OFFLINE_THRESHOLD_MINUTES', 10),
    'behaviour_min_trips' => (int) env('FLEET_BEHAVIOUR_MIN_TRIPS', 3),
    'dashboard_idle_threshold_hours' => (int) env('FLEET_DASHBOARD_IDLE_THRESHOLD_HOURS', 2),
    'dashboard_short_trip_max_km' => (float) env('FLEET_DASHBOARD_SHORT_TRIP_MAX_KM', 5),
    'estimated_tank_capacity_liters' => (float) env('FLEET_ESTIMATED_TANK_CAPACITY_LITERS', 100),
    'expected_fuel_consumption_l_per_100km' => (float) env('FLEET_EXPECTED_FUEL_CONSUMPTION_L_PER_100KM', 28),
    'after_hours_start_hour' => (int) env('FLEET_AFTER_HOURS_START_HOUR', 7),
    'after_hours_end_hour' => (int) env('FLEET_AFTER_HOURS_END_HOUR', 19),
    'telemetry_fresh_minutes' => (int) env('FLEET_TELEMETRY_FRESH_MINUTES', 15),
    'telemetry_stale_minutes' => (int) env('FLEET_TELEMETRY_STALE_MINUTES', 60),
    'telemetry_offline_hours' => (int) env('FLEET_TELEMETRY_OFFLINE_HOURS', 24),
    'telemetry_low_frequency_events_24h' => (int) env('FLEET_TELEMETRY_LOW_FREQUENCY_EVENTS_24H', 12),
    'geofence_analytics_window_days' => (int) env('FLEET_GEOFENCE_ANALYTICS_WINDOW_DAYS', 7),
    'fuel_anomaly_window_minutes' => (int) env('FLEET_FUEL_ANOMALY_WINDOW_MINUTES', 120),
    'fuel_stationary_distance_km' => (float) env('FLEET_FUEL_STATIONARY_DISTANCE_KM', 1),
    'fuel_unexpected_drop_pct' => (float) env('FLEET_FUEL_UNEXPECTED_DROP_PCT', 8),
    'fuel_possible_theft_drop_pct' => (float) env('FLEET_FUEL_POSSIBLE_THEFT_DROP_PCT', 12),
    'fuel_refuel_increase_pct' => (float) env('FLEET_FUEL_REFUEL_INCREASE_PCT', 10),
    'fuel_abnormal_consumption_multiplier' => (float) env('FLEET_FUEL_ABNORMAL_CONSUMPTION_MULTIPLIER', 1.8),
    'fuel_min_distance_for_consumption_km' => (float) env('FLEET_FUEL_MIN_DISTANCE_FOR_CONSUMPTION_KM', 10),
    'dashboard_risk_thresholds' => [
        'maintenance_overdue' => [
            'medium' => (int) env('FLEET_RISK_MAINTENANCE_OVERDUE_MEDIUM', 1),
            'high' => (int) env('FLEET_RISK_MAINTENANCE_OVERDUE_HIGH', 3),
        ],
        'active_alerts' => [
            'medium' => (int) env('FLEET_RISK_ACTIVE_ALERTS_MEDIUM', 5),
            'high' => (int) env('FLEET_RISK_ACTIVE_ALERTS_HIGH', 10),
        ],
        'offline_vehicles' => [
            'medium' => (int) env('FLEET_RISK_OFFLINE_VEHICLES_MEDIUM', 1),
            'high' => (int) env('FLEET_RISK_OFFLINE_VEHICLES_HIGH', 3),
        ],
        'unassigned_vehicles' => [
            'medium' => (int) env('FLEET_RISK_UNASSIGNED_VEHICLES_MEDIUM', 3),
            'high' => (int) env('FLEET_RISK_UNASSIGNED_VEHICLES_HIGH', 7),
        ],
        'active_fuel_anomalies' => [
            'medium' => (int) env('FLEET_RISK_ACTIVE_FUEL_ANOMALIES_MEDIUM', 1),
            'high' => (int) env('FLEET_RISK_ACTIVE_FUEL_ANOMALIES_HIGH', 2),
        ],
    ],
];
