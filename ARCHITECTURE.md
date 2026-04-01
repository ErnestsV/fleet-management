# Fleet Management MVP Architecture

## Stack

- Backend: Laravel 12, PHP 8.2+ runtime locally and PHP 8.3 in Docker, Sanctum, PostgreSQL, Redis, queues, scheduler
- Frontend: React, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router, Zustand, React Hook Form, Zod, Recharts
- Dev infra: Docker Compose, Mailpit, Postgres, Redis

## Backend boundaries

- `Domain/Companies`: tenancy root, company settings, super admin company management
- `Domain/Auth`: login, password reset, profile, sub-user creation flows
- `Domain/Fleet`: vehicles, drivers, assignments, vehicle state lookup
- `Domain/Telemetry`: raw event ingest, state derivation, simulator command, future bulk ingest
- `Domain/Alerts`: rule evaluation, async alert creation, offline scheduler checks
- `Domain/Maintenance`: schedules, service records, upcoming reminders
- `Domain/Shared`: DTOs, enums, support utilities

Controllers stay thin. Form Requests validate and gate. Services/actions own write workflows. Policies enforce company boundaries. Jobs handle async state, alert, and trip work. Resources shape API responses.

## Frontend boundaries

- `app/router`: route tree and auth-aware wrappers
- `app/providers`: QueryClient, auth bootstrap, theme/session providers
- `components`: reusable dashboard primitives
- `features/*`: page-level queries, forms, and feature-local components
- `lib/api`: typed API client and endpoint modules
- `pages`: route entry pages that compose features

## MVP scaling notes

- Raw telemetry remains append-only in `telemetry_events`
- Materialized vehicle state lives in `vehicle_states`
- Alert evaluation runs via queue jobs
- Offline checks run from scheduler
- Later upgrades can partition telemetry tables, add websocket broadcasting, swap in a real map provider, and separate ingestion workers without restructuring the entire app
