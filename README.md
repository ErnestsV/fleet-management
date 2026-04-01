# FleetOS MVP

Production-minded Phase 1 MVP for a fleet management and telematics SaaS platform inspired by Mapon, Samsara, and Geotab.

## Architecture

- `backend/`: Laravel 12 API, Sanctum auth, domain-oriented services, policies, queue jobs, commands, tests
- `frontend/`: React + TypeScript + Vite SPA, typed API client, role-aware routing, dashboard and operations pages
- `docker-compose.yml`: backend, queue, scheduler, frontend, postgres, redis, mailpit
- `ARCHITECTURE.md`: module boundaries and scaling notes

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
- `trips`, `alerts`, `geofences`, and `maintenance` are operational modules derived from or attached to those fleet assets.

## What each section is for

### Dashboard

- The dashboard is the operational overview page.
- It is meant to show fleet KPIs, live state, map context, trip trends, alert counts, driver/vehicle behaviour summaries, and other management analytics.
- In this MVP, the dashboard uses currently available telemetry, state, trip, and alert data rather than advanced BI/warehouse metrics.

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
- In this MVP, it uses a provider-agnostic map canvas backed by real vehicle coordinates and selection state.
- The intended future upgrade path is to replace the placeholder canvas with a real provider such as Mapbox or Leaflet without changing the fleet domain model.

### Drivers

- `Drivers` are operational people who can be assigned to vehicles.
- This section exists to manage driver records, track who is responsible for a vehicle, and preserve assignment history.
- Driver records can later be used in reporting, accountability, dispatching, and trip context.

### Trips

- `Trips` are derived records created from telemetry/state transitions, not typically entered manually.
- Their purpose is to show where, when, and how far vehicles traveled.
- Trip history supports later reporting, utilization analysis, route analysis, working-time analysis, and driver/vehicle behaviour metrics.

### Alerts

- `Alerts` are operational events generated by system rules.
- Current MVP alert sources include speeding, prolonged idling, offline detection, geofence entry/exit, and maintenance due.
- Alerts are primarily generated automatically from telemetry, current state, geofence logic, maintenance logic, and scheduled checks.

### Geofences

- `Geofences` are virtual geographic zones such as depots, warehouses, customer sites, or restricted areas.
- Their main purpose is to detect when a vehicle enters or exits those zones and raise alerts.
- In a fuller product they also support dwell-time reporting, arrival/departure reporting, route compliance, and site-based analytics.

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

## Super admin bootstrap

- Seeder: `php artisan db:seed --class=SuperAdminSeeder`
- Interactive command: `php artisan app:create-super-admin`

## Queue and scheduler

- Queue worker runs in the `queue` container
- Scheduler runs in the `scheduler` container
- Offline vehicle check runs every 5 minutes via `app:check-offline-vehicles`

## Telemetry ingest

Single event endpoint:

```http
POST /api/v1/telemetry/events
Authorization: Bearer demo-token-1
Content-Type: application/json
```

Example payload:

```json
{
  "vehicle_id": 1,
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
curl -X POST http://localhost:8000/api/v1/telemetry/events \
  -H "Authorization: Bearer demo-token-1" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": 1,
    "timestamp": "2026-03-31T08:30:00Z",
    "latitude": 56.9496,
    "longitude": 24.1052,
    "speed_kmh": 64,
    "engine_on": true
  }'
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
- `GET /api/v1/vehicle-states`
- `GET /api/v1/dashboard/summary`
- `POST /api/v1/telemetry/events`

## Current MVP notes

- Trips, assignments, geofences, maintenance, alerts, dashboard, profile, vehicles, and drivers are exposed in both API and frontend.
- Device auth is token-based for MVP. The `DeviceToken` model and ingestion service are structured so HMAC/device-signature auth can replace or augment it later.
- Vehicle state is materialized in `vehicle_states`; raw events remain append-only in `telemetry_events`.
- Alert checks run asynchronously through `EvaluateTelemetryAlertsJob`.
- Trip derivation uses an MVP assumption: a trip opens on a moving event and closes on the first later non-moving state.
- Geofence UI is circle-only for MVP; the backend geometry shape remains polygon-ready.

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
