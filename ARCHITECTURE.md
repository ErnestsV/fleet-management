# FleetOS Architecture

## Stack

- Backend: Laravel 12, PHP 8.2+ local runtime support and PHP 8.3 in Docker, Sanctum, PostgreSQL, Redis, queues, scheduler, Laravel Reverb
- Frontend: React, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router, Zustand, React Hook Form, Zod, Recharts, Leaflet
- Local infra: Docker Compose, Mailpit, PostgreSQL, Redis
- Production scaffold: Kubernetes manifests under `k8s/`, production container assets under `docker/`, and a manual GKE deployment workflow in `.github/workflows/deploy-gke.yml`
- Testing: PHPUnit feature tests, Vitest unit tests, Playwright smoke tests, GitHub Actions CI

## Backend boundaries

- `Domain/Ai`: page-scoped copilot context, structured tool registry, and operational recommendation tools
- `Domain/Companies`: tenancy root, company settings, super admin company management
- `Domain/Auth`: login, password reset, profile, account invitation, sub-user creation flows
- `Domain/Fleet`: vehicles, drivers, assignments, dashboard summaries, fuel insights, vehicle state lookup
- `Domain/Telemetry`: raw event ingest, device token provisioning, ingestion de-duplication, monthly telemetry partition support, state derivation, simulator command
- `Domain/Trips`: trip derivation and trip API payloads
- `Domain/Geofences`: geofence definitions plus entry/exit evaluation against live positions
- `Domain/Alerts`: rule evaluation, async alert creation, offline scheduler checks, driver-license checks
- `Domain/Maintenance`: schedules, service records, upcoming reminders
- `Domain/Platform`: platform operations, scheduler health, queue health, and failed job visibility
- `Domain/Realtime`: company-scoped fleet update broadcasts for cache invalidation and live UI refresh
- `Domain/Shared`: DTOs, enums, support utilities

Controllers stay thin. Form Requests validate and gate. Services/actions own write workflows. Policies enforce company boundaries. Jobs handle async state, alert, and trip work. Resources shape API responses.

## Frontend boundaries

- `app/router`: route tree and auth-aware wrappers
- `app/providers`: QueryClient, auth bootstrap wiring, and fleet realtime subscriptions
- `components`: reusable layout, UI, chart, form, map, and data-display primitives
- `features/*`: page-level queries, forms, and feature-local components
- `lib/api`: typed API client and endpoint modules
- `pages`: route entry pages that compose features into screen-level flows

## Runtime data flow

- Devices or integrations post telemetry to `POST /api/v1/telemetry/events` with a per-vehicle bearer token. Tokens are stored hashed and can be rotated without exposing the stored value.
- Raw telemetry remains append-only in monthly partitioned PostgreSQL `telemetry_events` tables. `telemetry_ingestion_keys` stores de-duplication reservations so retries do not create duplicate events.
- Telemetry ingestion stores the raw event, queues `ProcessTelemetryEventJob`, updates materialized `vehicle_states`, derives trips, syncs geofence state, resolves offline alerts, and queues alert evaluation.
- The queue worker handles telemetry processing and alert evaluation on dedicated queue names. Kubernetes also includes dedicated telemetry ingest and telemetry queue deployments for production scaling.
- Offline, maintenance, driver-license, telemetry partition, and scheduler heartbeat checks run from scheduled commands.
- Backend changes publish company-scoped `fleet.updated` events through Laravel Reverb. The frontend subscribes through `FleetRealtimeProvider` and invalidates relevant TanStack Query caches.

Longer-term scaling notes live in the README `Future scaling notes` section so this file stays focused on current architecture and module boundaries.
