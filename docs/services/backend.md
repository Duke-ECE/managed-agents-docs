# Backend (managed-agents-backend)

Go 1.25 + Gin. The thin HTTP→gRPC proxy: browser traffic (JSON + SSE)
becomes `session.v1.SessionService` and `runtime.v1.AgentService` calls.
Also owns auth and the platform default LLM provider.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/health` | no | Liveness |
| GET | `/api/message` | no | Demo payload (hostname, time) |
| GET | `/api/me` | yes | Caller profile: email, `can_use_platform_llm`, `is_admin` |
| POST | `/api/sessions` | yes | Create session (durable record + live agent) |
| GET | `/api/sessions` | yes | List the caller's sessions (session-manager) |
| DELETE | `/api/sessions/:id` | yes | End session (session-manager first, runtime best-effort) |
| POST | `/api/sessions/:id/messages` | yes | Chat turn, SSE stream |
| GET | `/api/sessions/:id/messages` | yes | Transcript from session-manager |
| GET/POST/DELETE | `/api/admin/members` | admin | Whitelist CRUD (DELETE takes `/:email`) |

Auth: Supabase JWT verified via JWKS
(`<SUPABASE_URL>/auth/v1/.well-known/jwks.json`); the JWT `sub` becomes
`user_id` and overrides any client-sent value. `SUPABASE_URL` unset →
open mode (local dev only, loud startup warning).

## Access model (team whitelist)

Sign-in is open (email/password + GitHub OAuth), but the **platform
default LLM provider is gated** by the `team_members` table (RLS,
service-role only): a browser that sends no API key gets the default
injected only if its email is whitelisted — otherwise
`POST /api/sessions` answers 403 `platform LLM access not granted`.
User-supplied keys always pass. Members with `role='admin'` manage the
whitelist via `/api/admin/members`; the `internal/access/` slice owns
the rules, `internal/infrastructure/teammembers/` is the PostgREST
adapter. Open mode disables the gate.

gRPC→HTTP error mapping: `NOT_FOUND→404`, `PERMISSION_DENIED→403`,
`FAILED_PRECONDITION→410`, `RESOURCE_EXHAUSTED→429`, everything else→500.
A session-manager failure during creation is a 502 — never a silent
fallback to untracked sessions.

## Resume-on-404

When the runtime's `Chat` answers `NOT_FOUND` before any SSE frame (the
live session was lost to a runtime restart or TTL eviction), the backend
resumes instead of failing: it verifies ownership via session-manager
`GetSession`, refuses with 410 if the record is `ended` (ended is
terminal), re-creates the runtime session under the same id
(`ALREADY_EXISTS` from a concurrent resume is tolerated) — the runtime
hydrates from the durable transcript — and retries the turn once. A
mid-stream `NOT_FOUND` stays fatal. Domain errors gained
`KindFailedPrecondition`, mapped to HTTP 410.

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
