import { expect, test } from '@playwright/test';

const dashboardSummary = {
  total_vehicles: 1,
  moving_vehicles: 1,
  idling_vehicles: 0,
  active_alerts: 1,
  trips_today: 2,
  distance_today_km: 24,
  alerts_by_type: [{ type: 'speeding', count: 1 }],
  distance_by_vehicle: [{ vehicle_id: 1, label: 'NL-101', distance_km: 24 }],
  trips_over_time: [{ day: 'Mon', trip_count: 2 }],
  fleet_efficiency: {
    selected_average_score: 82,
    breakdown: [{ label: 'Utilization', score: 82 }],
  },
  fleet_utilization: {
    active_today: {
      count: 1,
      percentage: 100,
    },
    unused_over_3_days: {
      count: 0,
      percentage: 0,
    },
    idling_over_threshold: {
      count: 0,
      percentage: 0,
      threshold_hours: 2,
    },
    no_trips_today: {
      count: 0,
      percentage: 0,
    },
    short_trips_only_today: {
      count: 0,
      percentage: 0,
      max_trip_km: 5,
    },
  },
  telemetry_health: {
    total_devices: 1,
    freshness_rate_pct: 100,
    healthy_count: 1,
    stale_count: 0,
    offline_over_24h_count: 0,
    no_data_count: 0,
    low_frequency_count: 0,
    missing_fields_count: 0,
    freshness_buckets: [
      { key: 'fresh', label: '0-15m', count: 1 },
      { key: 'delayed', label: '15-60m', count: 0 },
      { key: 'stale', label: '60m-24h', count: 0 },
      { key: 'offline', label: '>24h', count: 0 },
      { key: 'no_data', label: 'No data', count: 0 },
    ],
    thresholds: {
      fresh_minutes: 15,
      stale_minutes: 60,
      offline_hours: 24,
      low_frequency_events_24h: 12,
    },
  },
  fuel_anomalies: {
    total_anomalies: 2,
    active_anomalies: 2,
    resolved_anomalies: 0,
    affected_vehicles: 1,
    unexpected_drop_count: 1,
    possible_theft_count: 1,
    refuel_without_trip_count: 0,
    abnormal_consumption_count: 0,
    suspicious_vehicles: [
      {
        vehicle_id: 1,
        plate_number: 'NL-101',
        name: 'North 101',
        anomaly_count: 2,
        latest_triggered_at: '2026-04-01T10:00:00Z',
      },
    ],
    thresholds: {
      unexpected_drop_pct: 8,
      possible_theft_drop_pct: 12,
      refuel_increase_pct: 10,
      abnormal_consumption_multiplier: 1.8,
    },
  },
  driving_behaviour: {
    has_data: true,
    minimum_trip_samples: 3,
    insufficient_vehicle_count: 0,
    average_score: 88,
    vehicle_scores: [{ vehicle_id: 1, label: 'NL-101', name: 'North 101', score: 88 }],
    best_vehicles: [{ vehicle_id: 1, label: 'NL-101', name: 'North 101', score: 88 }],
    worst_vehicles: [{ vehicle_id: 1, label: 'NL-101', name: 'North 101', score: 88 }],
  },
  fuel: {
    trend: [
      {
        day: 'Mon',
        avg_fuel_level_pct: 74,
        distance_km: 24,
        estimated_fuel_used_l: 10.2,
        estimated_consumption_l_per_100km: 28.4,
      },
    ],
    estimated_fuel_used_yesterday_l: 10.2,
    estimated_fuel_used_previous_day_l: 9.8,
    estimated_avg_consumption_yesterday_l_per_100km: 28.4,
    estimated_avg_consumption_previous_day_l_per_100km: 27.1,
    average_fuel_level_yesterday_pct: 74,
    expected_consumption_l_per_100km: 28,
    delta_used_pct: 4.1,
  },
  mileage: {
    yesterday_distance_km: 24,
    previous_distance_km: 21,
    delta_pct: 14.3,
  },
  working_time: {
    earliest_start: [],
    latest_start: [],
    earliest_end: [],
    latest_end: [],
  },
  fleet: [
    {
      id: 1,
      name: 'North 101',
      plate_number: 'NL-101',
      make: 'Volvo',
      model: 'FH',
      status: 'moving',
      latitude: 56.95,
      longitude: 24.11,
      heading: 90,
      speed_kmh: 52,
      fuel_level: 74,
      engine_on: true,
      last_event_at: '2026-04-01T10:00:00Z',
      driver: 'John Driver',
    },
  ],
};

test('redirects unauthenticated users to the login page', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

test('renders the authenticated dashboard and mobile navigation with mocked API responses', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('fleetos.token', 'test-token');
  });

  await page.route('**/api/v1/auth/user', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: 1,
          company_id: null,
          name: 'Platform Admin',
          email: 'admin@example.test',
          role: 'super_admin',
          timezone: 'Europe/Riga',
          is_active: true,
          company: null,
        },
      }),
    });
  });

  await page.route('**/api/v1/alerts*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            id: 1,
            company_id: 1,
            type: 'speeding',
            severity: 'high',
            message: 'Speeding detected',
            triggered_at: '2026-04-01T10:00:00Z',
            resolved_at: null,
            status: 'active',
            vehicle: { id: 1, name: 'North 101', plate_number: 'NL-101' },
          },
        ],
      }),
    });
  });

  await page.route('**/api/v1/dashboard/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(dashboardSummary),
    });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Operations dashboard' })).toBeVisible();
  await expect(page.getByText('Total vehicles')).toBeVisible();
  await expect(page.getByText('Active alerts')).toBeVisible();
  await expect(page.getByText('NL-101').first()).toBeVisible();

  await page.getByRole('button', { name: 'Open mobile navigation' }).click();
  await expect(page.getByRole('link', { name: 'Vehicles' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Maintenance' })).toBeVisible();
});
