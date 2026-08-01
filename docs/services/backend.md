# Backend (managed-agents-backend)

Go 1.25 + Gin. The thin HTTP→gRPC proxy: browser traffic (JSON + SSE)
becomes `session.v1.SessionService` and `runtime.v1.AgentService` calls.
Also owns auth and the platform default LLM provider.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/health` | no | Liveness |
| GET | `/api/message` | no | Demo payload (hostname, time) |
| POST | `/api/sessions` | yes | Create session (durable record + live agent) |
| GET | `/api/sessions` | yes | List the caller's sessions (session-manager) |
| DELETE | `/api/sessions/:id` | yes | End session (session-manager first, runtime best-effort) |
| POST | `/api/sessions/:id/messages` | yes | Chat turn, SSE stream |
| GET | `/api/sessions/:id/messages` | yes | Transcript from session-manager |

Auth: Supabase JWT verified via JWKS
(`<SUPABASE_URL>/auth/v1/.well-known/jwks.json`); the JWT `sub` becomes
`user_id` and overrides any client-sent value. `SUPABASE_URL` unset →
open mode (local dev only, loud startup warning).

gRPC→HTTP error mapping: `NOT_FOUND→404`, `PERMISSION_DENIED→403`,
`FAILED_PRECONDITION→410`, `RESOURCE_EXHAUSTED→429`, everything else→500.
A session-manager failure during creation is a 502 — never a silent
fallback to untracked sessions.

## Default LLM provider

`internal/provider` reads the `is_default` row from the Supabase
`llm_providers` table via PostgREST (service key, 5-minute cache, errors
not cached). When a session is created **without** a user API key, the
default config is injected into the runtime call. The key never reaches
the browser; the table is RLS-locked to the service role.

## Environment

| Var | Default | Notes |
|-----|---------|-------|
| `PORT` | `8080` | |
| `RUNTIME_ADDR` | `agent-runtime:50052` | lazy gRPC dial |
| `SESSION_MANAGER_ADDR` | `session-manager:50053` | unset = legacy runtime-backed sessions |
| `SUPABASE_URL` | — | unset = auth disabled (open mode) |
| `SUPABASE_SERVICE_ROLE_KEY` | — | enables the default-provider feature (needs `SUPABASE_URL` too) |

Repo: [Duke-ECE/managed-agents-backend](https://github.com/Duke-ECE/managed-agents-backend)
