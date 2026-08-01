# Architecture

## System overview

```
Browser (managed-agents-frontend, React SPA)
  → HTTPS + SSE, Bearer JWT (Supabase auth)
managed-agents-backend (Go/Gin HTTP proxy, :8080)
  → gRPC session.v1.SessionService (session lifecycle, transcripts)
  → gRPC runtime.v1.AgentService   (live chat)
session-manager (Go gRPC, :50053)
  → Supabase PostgREST: agent_sessions / agent_messages (RLS: service role only)
agent-runtime (TypeScript gRPC, :50052)
  → streams LLM responses via any OpenAI-compatible endpoint
  → write-through of each completed turn via session.v1.AppendTurn
  → (planned) tool execution via sandbox.v2.SandboxExecutorService
sandbox-manager (Go gRPC, :50051)
  → Kubernetes API: pooled, single-use sandbox pods in namespace pi-sandbox
```

External dependencies: Supabase (auth + Postgres), an OpenAI-compatible
LLM endpoint (default: OpenRouter), GitHub Container Registry.

## Request flows

### Sign in

Browser → Supabase Auth (email/password; GitHub OAuth planned) →
access token (JWT). Every API call carries `Authorization: Bearer <jwt>`.
The backend verifies it against the Supabase JWKS endpoint; the JWT
`sub` becomes `user_id` everywhere downstream.

### Create a session

1. Frontend `POST /api/sessions` (optionally with an `llm` config).
2. Backend resolves the LLM config: user-supplied key wins; otherwise it
   reads the default provider from Supabase `llm_providers`
   (server-side only, 5-minute cache).
3. Backend → session-manager `CreateSession(user_id, llm_model)` →
   durable row + `sess-<hex>` id. Failure here is a 502 — the platform
   never silently creates untracked sessions.
4. Backend → agent-runtime `CreateSession(user_id, llm, session_id)` →
   the runtime adopts the session-manager's id and starts an in-memory
   pi agent.

### Send a message (chat turn)

1. Frontend `POST /api/sessions/:id/messages` (SSE).
2. Backend → runtime `Chat` (server-streaming gRPC) and translates each
   stream event into a same-named SSE event: `text_delta`, `tool_call`,
   `tool_result`, `error`, `done`.
3. The runtime streams the LLM response through its pi agent.
4. After a completed turn, the runtime fire-and-log calls
   session-manager `AppendTurn` (service token) with the user message,
   the aggregated assistant text, and any tool events. Errored or
   aborted turns are not persisted.
5. If the runtime answers `NOT_FOUND` before any SSE frame (live session
   lost to restart/TTL), the backend re-creates the session under the
   same id — hydrated from the transcript — and retries the turn once.
   `ended` sessions refuse with 410; mid-stream `NOT_FOUND` is fatal.

### Read history

Frontend `GET /api/sessions/:id/messages` → backend → session-manager
`GetTranscript`. Owner reads freely; any other user gets 403.

## Privilege model

| Layer | Rule |
|-------|------|
| Backend | Authenticates every `/api/sessions*` call; `sub` overrides any client-sent `user_id` |
| session-manager | The enforcement point: user-scoped RPCs check row ownership (`PERMISSION_DENIED`); runtime write-through requires a shared `x-service-token` |
| Postgres | RLS enabled with no policies on all app tables — only the service role (held by backend/session-manager) can read or write |
| agent-runtime | Defense in depth: also checks ownership on its in-memory sessions |

## Data stores (Supabase Postgres)

| Table | Owner | Contents |
|-------|-------|----------|
| `llm_providers` | backend | Platform LLM providers; exactly one `is_default` |
| `agent_sessions` | session-manager | Session records: id, owner, status, model, timestamps |
| `agent_messages` | session-manager | Ordered turns: role (user/assistant/tool_call/tool_result) + JSON content |

All migrations use timestamped versions (`YYYYMMDDHHMMSS_name.sql`) —
several repos push migrations to the shared project, and plain counters
collide silently.

## Runtime state vs durable state

Runtime memory is a **hydratable cache**, not the source of truth. Live
agents sit in agent-runtime memory (cap 20, 30-minute idle TTL, single
replica); durable session records and transcripts live in Supabase
Postgres via session-manager. When a live session is lost (runtime
restart, TTL eviction), the next turn resumes it: the backend re-creates
the runtime session under the same id and the runtime **hydrates** the
agent from the durable transcript — sessions survive restarts and
eviction (see Changelog 2026-08-01).
