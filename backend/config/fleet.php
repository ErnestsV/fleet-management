<?php

return [
    'offline_threshold_minutes' => (int) env('FLEET_OFFLINE_THRESHOLD_MINUTES', 10),
    'behaviour_min_trips' => (int) env('FLEET_BEHAVIOUR_MIN_TRIPS', 3),
    'dashboard_idle_threshold_hours' => (int) env('FLEET_DASHBOARD_IDLE_THRESHOLD_HOURS', 2),
    'dashboard_short_trip_max_km' => (float) env('FLEET_DASHBOARD_SHORT_TRIP_MAX_KM', 5),
    'after_hours_start_hour' => (int) env('FLEET_AFTER_HOURS_START_HOUR', 7),
    'after_hours_end_hour' => (int) env('FLEET_AFTER_HOURS_END_HOUR', 19),
];
