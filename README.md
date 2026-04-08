# FleetOS

Fleet management and telematics SaaS platform inspired by Mapon, Samsara, and Geotab.

## Architecture

- `backend/`: Laravel 12 API, Sanctum auth, domain-oriented services, policies, queue jobs, commands, tests
- `frontend/`: React + TypeScript + Vite SPA, typed API client, role-aware routing, dashboard and operations pages
- `docker-compose.yml`: backend, queue, scheduler, frontend, postgres, redis, mailpit
- `ARCHITECTURE.md`: module boundaries and scaling notes

## Branch workflow

- `main`: production-ready branch
- `develop`: integration branch for upcoming work before merging to `main`
- GitHub Actions CI runs on pushes to both branches and on pull requests targeting either branch

## Backend structure

```text
backend/app/
  Console/Commands
  Domain/
    Alerts/{Enums,Jobs,Models,Services}
    Auth/Services
    Companies/{Models,Services}
    Fleet/{Models,Services}
    Geofences/Enums
    Shared/Enums
    Telemetry/{Enums,Models,Services}
  Http/
    Controllers/Api
    Requests
    Resources
  Policies
  Providers
```

## Frontend structure

```text
frontend/src/
  app/{providers,router,store}
  components/{layout,maps,ui}
  features/{auth,dashboard}
  lib/api
  pages
  styles
  types
```

## Local setup

1. Copy the Docker env:
   - `cp .env.docker.example .env`
2. Copy the backend env:
   - `cp backend/.env.example backend/.env`
3. Start containers:
   - `docker-compose up --build -d`
4. Backend will be available at `http://localhost:18000`
5. Frontend will be available at `http://localhost:15173`
6. Mailpit UI will be available at `http://localhost:18025`

Notes:
- Containers run as your local UID/GID by default to avoid root-owned files in the workspace.
- The backend container waits for Postgres and Redis, then runs migrations on startup.
- Demo seed data is not automatically reseeded on backend restarts.
- Queue and scheduler containers do not run migrations or seeders.

## Demo seeding

- Docker now defaults to `APP_SEED_DEMO=false` so restarting the backend container does not reseed or overwrite local demo data.
- If you want to load the built-in demo tenant data intentionally, run:

```bash
docker compose exec backend php artisan db:seed --force
```

- Or temporarily enable it in your root `.env` for first boot only:

```env
APP_SEED_DEMO=true
```

- After the initial demo load, set it back to `false` to avoid reseeding on future backend restarts.

## Mail setup

The backend `.env.example` already includes Mailpit-friendly values:

```env
MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"
```

Mailpit is exposed at `http://localhost:18025` by default and captures password reset mail locally.

## Demo credentials

- Super admin: `superadmin@fleetos.test` / `password`
- Demo company owner: `owner@northern-logistics.test` / `password`
- Demo telemetry tokens: `demo-token-1`, `demo-token-2`, `demo-token-3`, `demo-token-4`

## Product overview

FleetOS is a multi-tenant fleet management SaaS.

At a high level:

- The platform `super_admin` is the SaaS owner/operator account. This role manages tenant companies, bootstraps their first users, supports testing/demo flows, and can inspect platform-wide operations.
- A `company` is a customer organization using the platform.
- `users` are people from that company who log into the web application, such as owners, admins, dispatchers, or viewers.
- `drivers` are operational driver records. They do not automatically mean web-login accounts.
- `vehicles` are company-owned fleet assets that receive telemetry, generate trips, and can be assigned to drivers.
- `telemetry events` are raw append-only GPS/device messages coming from remote devices or integration APIs.
- `vehicle state` is the latest materialized status of each vehicle for fast UI access.
- `driver insights` are management-facing analytics derived from trips, assignment windows, and alert signals per driver.
- `telemetry health` is the device-reliability and signal-freshness layer for seeing whether active vehicles are reporting often enough and with complete latest fields.
- `fuel insights` is the fuel-control analytics layer for suspicious fuel drops, stationary refuels, and consumption anomalies derived from telemetry deltas.
- `trips`, `alerts`, `geofences`, and `maintenance` are operational modules derived from or attached to those fleet assets.

## What each section is for

### Dashboard

- The dashboard is the operational overview page.
- It is meant to show fleet KPIs, live state, map context, trip trends, alert counts, driver/vehicle behaviour summaries, and other management analytics.
- The dashboard uses currently available telemetry, state, trip, and alert data rather than advanced BI/warehouse metrics.

### Companies

- `Companies` are tenant organizations that subscribe to the SaaS.
- The super admin uses this section to create and manage customer companies.
- The `Active` flag is intended to mean whether the tenant is enabled to use the platform. In business terms, an inactive company is suspended or disabled.

### Users

- `Users` are login-enabled application users inside a company.
- Typical examples are company owner, fleet manager, dispatcher, admin staff, or read-only viewer.
- This is separate from drivers because many drivers do not need direct access to the web platform.
- Users are company-scoped, so users from one company should not see data from another company.

### Vehicles

- `Vehicles` are the actual fleet assets being tracked.
- Vehicles belong to a company, not to the currently logged-in person.
- If one authorized company user creates a vehicle, other authorized users from that same company should see it.
- The `Active vehicle` flag is intended to mean whether the vehicle is still part of the managed fleet, not whether it is currently moving right now.
- Real-time state such as moving, idling, stopped, or offline comes from telemetry and vehicle state logic.

### Live Map

- `Live Map` is the fleet-operations workspace for searching vehicles and viewing their current state on a map-style surface.
- It uses a provider-agnostic map canvas backed by real vehicle coordinates and selection state.
- The intended future upgrade path is to replace the placeholder canvas with a real provider such as Mapbox or Leaflet without changing the fleet domain model.

### Drivers

- `Drivers` are operational people who can be assigned to vehicles.
- This section exists to manage driver records, track who is responsible for a vehicle, and preserve assignment history.
- Driver records can later be used in reporting, accountability, dispatching, and trip context.

### Driver Insights

- `Driver Insights` is the management analytics page for comparing driver output and coaching signals over a recent rolling window.
- It is derived from trip activity attributed through assignment windows plus speeding and idling alerts.
- Current metrics include trip counts, distance, average trip distance, average trip duration, drive time, after-hours trips, and a coaching-oriented driver score.
- It is intended for recognition, coaching, and identifying underused or risky driving patterns rather than for payroll or compliance.

### Trips

- `Trips` are derived records created from telemetry/state transitions, not typically entered manually.
- Their purpose is to show where, when, and how far vehicles traveled.
- Trip history supports later reporting, utilization analysis, route analysis, working-time analysis, and driver/vehicle behaviour metrics.

### Fuel Insights

- `Fuel Insights` is the fuel-control analytics page for suspicious fuel behaviour across the fleet.
- It is derived from telemetry fuel deltas, odometer movement, engine state, and configured fleet baselines.
- Current metrics include unexpected drops, possible fuel theft, refuel without trip, abnormal consumption, and the most suspicious vehicles for follow-up.
- The detailed view supports search, numeric pagination, filtering by anomaly type/status, and the supporting telemetry delta values used by the heuristic.
- Fuel anomalies are also exposed through the shared `Alerts` module so operators can review them in the normal alert stream.
- Authorized admins can manually resolve fuel anomalies from the fuel insights history table when the issue has been reviewed or handled.

### Telemetry Health

- `Telemetry Health` is the device reliability and signal quality page.
- It exists to help operators understand whether the data stream itself is trustworthy before making decisions from trips, alerts, or live status.
- Current metrics include freshness rate, healthy devices, stale telemetry, devices offline over threshold, low-frequency devices, missing latest fields, and no-data vehicles.
- The detailed view supports search, filtering, freshness buckets, and per-vehicle diagnostics such as last event age and missing fields.

### Alerts

- `Alerts` are operational events generated by system rules.
- Current alert sources include speeding, prolonged idling, offline detection, geofence entry/exit, maintenance due, and fuel anomaly heuristics.
- Alerts are primarily generated automatically from telemetry, current state, geofence logic, maintenance logic, and scheduled checks.

### Geofences

- `Geofences` are virtual geographic zones such as depots, warehouses, customer sites, or restricted areas.
- Their main purpose is to detect when a vehicle enters or exits those zones and raise alerts.
- The section includes both `Manage` and `Analytics` views.
- Analytics is derived from geofence entry and exit alert history to show top visited locations, total entries/exits, active visits, total dwell time, average dwell time, and a per-location activity table.
- In a fuller product it can expand further into arrival/departure reporting, route compliance, and site-based analytics.

### Maintenance

- `Maintenance` is for planning and recording vehicle service work.
- A `schedule` is the planned recurring maintenance rule.
  Example: oil change every `90` days or every `15,000` km.
- A `record` is the actual completed maintenance event.
  Example: oil and filter replacement completed on a specific date at a specific odometer reading.
- `next_due_date` and `next_due_odometer_km` represent the next service target.
- `interval_days` and `interval_km` define how the next cycle should be recalculated after a service record is logged.
- Business value:
  - preventive maintenance planning
  - reduced breakdown risk
  - service history tracking
  - cost visibility
  - upcoming due reminders and alerts

### Profile

- `Profile` is the authenticated account settings area for the signed-in user.
- It is used to review role/company context, update profile details, and change the password.

## Typical business flow

1. The platform owner creates a company.
2. The company gets one or more internal users.
3. The company creates vehicles and driver records.
4. Devices or integrations send telemetry into the ingestion API.
5. Vehicle state is materialized from the telemetry stream.
6. Trips and alerts are derived from that data.
7. Geofences add location-based events.
8. Maintenance schedules and records support service planning and audit history.
9. Driver insights, telemetry health, and fuel insights surfaces turn the operational stream into management, reliability, and loss-prevention analytics.

## Super admin bootstrap

- Seeder: `php artisan db:seed --class=SuperAdminSeeder`
- Interactive command: `php artisan app:create-super-admin`

## Queue and scheduler

- Queue worker runs in the `queue` container
- Scheduler runs in the `scheduler` container
- Offline vehicle check runs every 5 minutes via `app:check-offline-vehicles`

## Telemetry ingest

Device authentication flow:

- When a vehicle is created, the system automatically generates a random device token for it.
- The plain token is shown once in the vehicle-creation response/UI so an installer or hardware integrator can provision the physical device.
- The database stores only the hashed token, not the plain secret.
- If the token is lost, the admin cannot reveal it again; they must rotate the token from the vehicle details screen and reprovision the device.
- Seeded demo vehicles still include deterministic local-development tokens like `demo-token-<vehicle_id>`, but production-style provisioning should use the generated vehicle token flow above.

Important:

- A real device does not invent its own token. The token must come from FleetOS provisioning.
- In local development, the preferred flow is still to create a vehicle in the UI, copy the generated token, and use that exact token in Postman.
- The seeded `demo-token-<vehicle_id>` values are only a local shortcut for existing demo vehicles.

Single event endpoint:

```http
POST /api/v1/telemetry/events
Authorization: Bearer demo-token-1
Content-Type: application/json
```

Example payload:

```json
{
  "timestamp": "2026-03-31T08:30:00Z",
  "latitude": 56.9496,
  "longitude": 24.1052,
  "speed_kmh": 64,
  "engine_on": true,
  "odometer_km": 182345.2,
  "fuel_level": 58.4,
  "heading": 135
}
```

cURL example:

```bash
curl -X POST http://localhost:18000/api/v1/telemetry/events \
  -H "Authorization: Bearer demo-token-1" \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2026-03-31T08:30:00Z",
    "latitude": 56.9496,
    "longitude": 24.1052,
    "speed_kmh": 64,
    "engine_on": true
  }'
```

### Simulating a real device in Postman

Recommended local flow:

1. Create a vehicle in the UI.
2. Copy the one-time provisioning token shown after vehicle creation.
3. In Postman, use:
   - Method: `POST`
   - URL: `http://localhost:18000/api/v1/telemetry/events`
   - Header: `Authorization: Bearer <copied-device-token>`
   - Header: `Content-Type: application/json`
4. Send telemetry in chronological order.

Notes:

- The telemetry endpoint authenticates the device by hashing the bearer token and matching it against `device_tokens.token`.
- The request body does not use `device_identifier`. The token identifies the device/vehicle pair.
- Keep timestamps increasing. Delayed historical backfill events are stored, but out-of-order payloads make manual QA harder to reason about.
- Alerts and dashboard summaries poll in the frontend approximately every 10 seconds, so external Postman events should appear shortly without a hard refresh.

Accepted payload fields:

- `timestamp` required
- `latitude` required
- `longitude` required
- `speed_kmh` required
- `engine_on` required
- `odometer_km` optional
- `fuel_level` optional
- `heading` optional
- `vehicle_id` optional, but typically unnecessary when the bearer token already belongs to the intended vehicle

Example moving event:

```json
{
  "timestamp": "2026-04-03T08:00:00Z",
  "latitude": 56.9496,
  "longitude": 24.1052,
  "speed_kmh": 48,
  "engine_on": true,
  "odometer_km": 50000,
  "fuel_level": 80,
  "heading": 90
}
```

Additional example payloads:

Stop / close trip:

```json
{
  "timestamp": "2026-04-03T08:25:00Z",
  "latitude": 56.9600,
  "longitude": 24.1300,
  "speed_kmh": 0,
  "engine_on": false,
  "odometer_km": 50010,
  "fuel_level": 79,
  "heading": 100
}
```

Speeding:

```json
{
  "timestamp": "2026-04-03T08:40:00Z",
  "latitude": 56.9610,
  "longitude": 24.1310,
  "speed_kmh": 128,
  "engine_on": true,
  "odometer_km": 50020,
  "fuel_level": 78,
  "heading": 105
}
```

Maintenance due by odometer:

```json
{
  "timestamp": "2026-04-03T08:50:00Z",
  "latitude": 56.9620,
  "longitude": 24.1320,
  "speed_kmh": 42,
  "engine_on": true,
  "odometer_km": 50025,
  "fuel_level": 77,
  "heading": 110
}
```

Outside geofence:

```json
{
  "timestamp": "2026-04-03T09:00:00Z",
  "latitude": 56.9400,
  "longitude": 24.0900,
  "speed_kmh": 30,
  "engine_on": true,
  "odometer_km": 50035,
  "fuel_level": 76,
  "heading": 120
}
```

Inside geofence:

```json
{
  "timestamp": "2026-04-03T09:05:00Z",
  "latitude": 56.9496,
  "longitude": 24.1052,
  "speed_kmh": 20,
  "engine_on": true,
  "odometer_km": 50040,
  "fuel_level": 76,
  "heading": 130
}
```

Fuel trend / mileage baseline example for a different day:

```json
{
  "timestamp": "2026-04-01T18:00:00Z",
  "latitude": 56.9700,
  "longitude": 24.1800,
  "speed_kmh": 0,
  "engine_on": false,
  "odometer_km": 49980,
  "fuel_level": 78,
  "heading": 120
}
```

### Manual telemetry QA flow

The sequence below is the safest way to validate the operational flow end to end. Use a fresh vehicle token and keep timestamps increasing.

1. Send a moving event.
   Expected:
   - vehicle state changes to `moving`
   - live map/fleet table update
   - a trip opens
2. Send another moving event later.
   Expected:
   - trip remains open
   - distance and average speed start to populate
3. Send a stop event.
   Expected:
   - vehicle state becomes `stopped`
   - trip closes with an end time
4. Send a speeding event.
   Expected:
   - a `speeding` alert is created
   - notifications count increases
5. Create a maintenance schedule for that vehicle with a near `next_due_odometer_km`, then send an event at or above that threshold.
   Expected:
   - a `maintenance_due` alert is created
   - the schedule stays in `Upcoming` until a maintenance record resolves it
6. Send an inside-geofence event followed by an outside-geofence event to validate exit, or an outside-geofence event followed by an inside-geofence event to validate entry.
   Expected:
   - the matching `geofence_entry` or `geofence_exit` alert appears in alert history for the transition you just triggered
   - these geofence alerts are informational and do not inflate the notifications badge
7. Create a maintenance record linked to the due schedule.
   Expected:
   - the `maintenance_due` alert resolves
   - the schedule advances to the next date / odometer target
8. Send telemetry on at least two different calendar days if you want the dashboard mileage and fuel trend widgets to show a meaningful baseline and delta.

### Offline alert testing

An offline alert means the platform has not received telemetry for a vehicle within the configured freshness window.

Current default:

- `fleet.offline_threshold_minutes=10`

Ways to test it:

- Wait until a vehicle becomes stale naturally, then run:

```bash
docker compose exec backend php artisan app:check-offline-vehicles
```

- Or let the scheduler do it:

```bash
docker compose exec backend php artisan schedule:run
```

Expected:

- vehicle state becomes `offline`
- a new `offline_vehicle` alert is created

### Queue and scheduler requirements for manual QA

- Telemetry ingest itself runs through the `backend` API container.
- Alert evaluation for telemetry is queued, so the `queue` container must be running.
- Scheduled checks such as offline-vehicle detection and date-based maintenance checks require the `scheduler` container.

Useful checks:

```bash
docker compose ps
docker compose logs --tail=50 queue
docker compose logs --tail=50 scheduler
```

Simulator command:

```bash
php artisan app:simulate-telemetry --count=20
```

## Auth API

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/auth/user`

## Operational API

- `GET|POST /api/v1/companies`
- `PATCH /api/v1/companies/{company}`
- `GET|POST /api/v1/users`
- `PATCH /api/v1/users/{user}`
- `GET|POST /api/v1/vehicles`
- `GET|PATCH|DELETE /api/v1/vehicles/{vehicle}`
- `GET|POST /api/v1/drivers`
- `GET|PATCH|DELETE /api/v1/drivers/{driver}`
- `GET /api/v1/driver-insights`
- `GET /api/v1/fuel-insights`
- `GET /api/v1/geofence-analytics`
- `POST /api/v1/alerts/{alert}/resolve`
- `GET /api/v1/trips`
- `GET /api/v1/trips/{trip}`
- `GET /api/v1/vehicles/{vehicle}/trips`
- `GET|POST /api/v1/vehicle-driver-assignments`
- `POST /api/v1/vehicle-driver-assignments/{vehicleDriverAssignment}/end`
- `GET|POST|PATCH|DELETE /api/v1/geofences`
- `GET|POST|PATCH|DELETE /api/v1/maintenance-schedules`
- `GET /api/v1/maintenance-upcoming`
- `GET|POST|PATCH|DELETE /api/v1/maintenance-records`
- `GET /api/v1/alerts`
- `GET /api/v1/telemetry-health`
- `GET /api/v1/vehicle-states`
- `GET /api/v1/dashboard/summary`
- `POST /api/v1/telemetry/events`

## Current product notes

- Trips, assignments, geofences, maintenance, alerts, dashboard, driver insights, telemetry health, fuel insights, profile, vehicles, and drivers are exposed in both API and frontend.
- Device auth is token-based today. The `DeviceToken` model and ingestion service are structured so HMAC/device-signature auth can replace or augment it later.
- Vehicle state is materialized in `vehicle_states`; raw events remain append-only in `telemetry_events`.
- Alert checks run asynchronously through `EvaluateTelemetryAlertsJob`.
- Trip derivation currently assumes that a trip opens on a moving event and closes on the first later non-moving state.
- Geofence UI is currently circle-based; the backend geometry shape remains polygon-ready.

## Verification status

- `php artisan --version`: passes locally
- `php -l` across backend `app/`, `routes/`, and `tests/`: passes
- `npm run build` with `nvm use 20`: passes
- `docker-compose config`: passes
- Host `php artisan test`: still blocked by the host PHP missing `pdo_sqlite`
- Recommended path: run tests in Docker with `docker-compose run --rm --no-deps -e APP_SKIP_BOOTSTRAP=true backend php artisan test`

## Exact Docker commands

Startup order:

1. `cp .env.docker.example .env`
2. `cp backend/.env.example backend/.env`
3. `docker-compose up --build -d`
4. `docker-compose logs -f backend`
5. Open the frontend and log in with the seeded accounts

Start the full stack:

```bash
docker-compose up --build -d
```

View backend logs:

```bash
docker-compose logs -f backend
```

Run Laravel migrations manually:

```bash
docker-compose exec backend php artisan migrate --force
```

Seed demo data manually:

```bash
docker-compose exec backend php artisan db:seed --force
```

Create a super admin:

```bash
docker-compose exec backend php artisan app:create-super-admin
```

Run the queue worker:

```bash
docker-compose exec queue php artisan queue:work --tries=1 --timeout=0
```

Run the scheduler:

```bash
docker-compose exec scheduler php artisan schedule:work
```

Run backend tests without starting Postgres or Redis:

```bash
docker-compose run --rm --no-deps -e APP_SKIP_BOOTSTRAP=true backend php artisan test
```

Open a backend shell:

```bash
docker-compose exec backend sh
```

Run the frontend dev server:

```bash
docker-compose exec frontend npm run dev -- --host 0.0.0.0 --port 5173
```

Run the frontend production build:

```bash
docker-compose exec frontend npm run build
```

## Default local URLs and ports

- Frontend: `http://localhost:15173`
- Backend API: `http://localhost:18000`
- Mailpit UI: `http://localhost:18025`
- Mailpit SMTP: `localhost:11025`
- PostgreSQL: `localhost:15432`
- Redis: `localhost:16379`

All host ports are configurable through the root `.env` file created from `.env.docker.example`.

## Troubleshooting

- If a host port is already in use, edit `.env` and change `BACKEND_HOST_PORT`, `FRONTEND_HOST_PORT`, `POSTGRES_HOST_PORT`, `REDIS_HOST_PORT`, `MAILPIT_SMTP_HOST_PORT`, or `MAILPIT_UI_HOST_PORT`, then rerun `docker-compose up -d`.
- If the backend fails during first startup, run `docker-compose logs -f backend` and wait for the migration step to complete.
- If you want a clean local reset, run `docker-compose down -v` and then `docker-compose up --build -d`.
- If the frontend cannot reach the API after changing ports, update `.env` and restart the `frontend` container so `VITE_API_BASE_URL` is rebuilt with the new backend host port.
- If Docker tests should avoid normal app startup logic, use `docker-compose run --rm --no-deps -e APP_SKIP_BOOTSTRAP=true backend php artisan test`.

## Future scaling notes

- Split telemetry ingestion workers from the web API when ingest volume grows
- Partition `telemetry_events` by time and/or company
- Add websocket pushes for live fleet updates
- Replace map placeholders with Mapbox/Leaflet adapter components
- Export analytical aggregates to a warehouse for heavy reporting
- Add AI integration later around anomaly detection, maintenance suggestions, and fleet assistant workflows without mixing that logic into core CRUD domains
