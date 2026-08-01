# session-manager

Go 1.25 gRPC service (:50053) owning durable session records and
transcripts — the platform's **privilege enforcement point** for session
data. Storage is Supabase Postgres via PostgREST with a service key.

## RPCs and privilege

| RPC | Rule |
|-----|------|
| `CreateSession` | `user_id` required; generates `sess-<hex>` id |
| `GetSession` | owner only → else `PERMISSION_DENIED` |
| `ListSessions` | returns only the caller's sessions |
| `EndSession` | owner only; marks `ended` (idempotent) |
| `AppendTurn` | **service token only** (`x-service-token`); trusted runtime callers; appends to `ended` sessions rejected with `FAILED_PRECONDITION` (ended is terminal — transcripts stay readable) |
| `GetTranscript` | owner reads freely; authenticated non-owner → `PERMISSION_DENIED`; no user identity → service token (runtime hydration path) |

An unset `SERVICE_TOKEN` fails the token-gated paths closed. Domain
errors gained `KindFailedPrecondition`, mapped to
`codes.FailedPrecondition`.

## Tables

`agent_sessions(id, user_id, status, llm_model, created_at, last_active,
ended_at)` and `agent_messages(id, session_id → cascade, seq, role,
content jsonb, created_at)`. Both RLS-enabled with **no policies** — only
the service role can read or write, and only this service (and the
backend) holds that key. `AppendMessages` also bumps `last_active`, so
`ListSessions` ordering is meaningful.

## Environment

| Var | Default | Notes |
|-----|---------|-------|
| `PORT` | `50053` | |
| `SUPABASE_URL` | — | required |
| `SUPABASE_SERVICE_ROLE_KEY` | — | required (secret `supabase-service-role`) |
| `SERVICE_TOKEN` | — | shared with agent-runtime (secret `session-service-token`) |

gRPC reflection is enabled: `grpcurl -plaintext localhost:50053 list`.

Repo: [Duke-ECE/session-manager](https://github.com/Duke-ECE/session-manager)
