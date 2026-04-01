# Project Notes For Codex

- Frontend runs with Vite in dev mode inside Docker and supports hot reload.
- After normal frontend code changes, do not tell the user to run `docker compose restart frontend` unless the change specifically affects container/runtime configuration, installed dependencies, or environment variables.
- Prefer asking the user to refresh the browser only when a normal Vite hot update does not already pick up the change.
