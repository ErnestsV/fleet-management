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
  driving_behaviour: {
    average_score: 88,
    vehicle_scores: [{ vehicle_id: 1, label: 'NL-101', name: 'North 101', score: 88 }],
    best_vehicles: [{ vehicle_id: 1, label: 'NL-101', name: 'North 101', score: 88 }],
    worst_vehicles: [{ vehicle_id: 1, label: 'NL-101', name: 'North 101', score: 88 }],
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
