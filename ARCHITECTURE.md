# Fleet Management MVP Architecture

## Stack

- Backend: Laravel 12, PHP 8.2+ runtime locally and PHP 8.3 in Docker, Sanctum, PostgreSQL, Redis, queues, scheduler
- Frontend: React, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router, Zustand, React Hook Form, Zod, Recharts
- Dev infra: Docker Compose, Mailpit, Postgres, Redis
- Testing: PHPUnit feature tests, Vitest unit tests, Playwright smoke tests, GitHub Actions CI

## Backend boundaries

- `Domain/Companies`: tenancy root, company settings, super admin company management
- `Domain/Auth`: login, password reset, profile, account invitation, sub-user creation flows
- `Domain/Fleet`: vehicles, drivers, assignments, dashboard summaries, vehicle state lookup
- `Domain/Telemetry`: raw event ingest, device token provisioning, state derivation, simulator command, future bulk ingest
- `Domain/Trips`: trip derivation and trip API payloads
- `Domain/Geofences`: geofence definitions plus entry/exit evaluation against live positions
- `Domain/Alerts`: rule evaluation, async alert creation, offline scheduler checks, driver-license checks
- `Domain/Maintenance`: schedules, service records, upcoming reminders
- `Domain/Shared`: DTOs, enums, support utilities

Controllers stay thin. Form Requests validate and gate. Services/actions own write workflows. Policies enforce company boundaries. Jobs handle async state, alert, and trip work. Resources shape API responses.

## Frontend boundaries

- `app/router`: route tree and auth-aware wrappers
- `app/providers`: QueryClient and auth bootstrap wiring
- `components`: reusable layout, UI, chart, form, map, and data-display primitives
- `features/*`: page-level queries, forms, and feature-local components
- `lib/api`: typed API client and endpoint modules
- `pages`: route entry pages that compose features into screen-level flows

## MVP scaling notes

- Raw telemetry remains append-only in `telemetry_events`
- Materialized vehicle state lives in `vehicle_states`
- Device auth tokens are issued per vehicle and rotated without exposing stored hashes
- Alert evaluation runs via queue jobs
- Offline, maintenance, and driver-license checks run from the scheduler
- Later upgrades can partition telemetry tables, add websocket broadcasting, swap in a real map provider, and separate ingestion workers without restructuring the entire app
