# agent-runtime

TypeScript (Node 22) gRPC server hosting agent sessions. Each session
embeds a pi agent (`@earendil-works/pi-agent-core` + `pi-ai`) pointed at
any OpenAI-compatible LLM endpoint.

## What it serves

`runtime.v1.AgentService`: `CreateSession` (adopts the session-manager's
`session_id` when provided), `EndSession`, `ListSessions`, and
server-streaming `Chat`.

Chat stream events (translated 1:1 by the backend into SSE):
`text_delta`, `tool_call`, `tool_result`, `error`, `done` (with token
usage). A second concurrent turn on one session → `FAILED_PRECONDITION`.

## Sessions

Live sessions are in-memory (`sess-<hex>` ids, cap `MAX_SESSIONS`, idle
reaper every minute over `SESSION_TTL_MINUTES`) — a hydratable cache
over the durable state owned by session-manager (see write-through and
hydration below). Ownership is enforced in memory too (defense in
depth).

## Turn write-through

After each **completed** Chat turn, `SessionClient`
(`src/session-client.ts`, formerly `SessionWriter`) calls
`session.v1.AppendTurn` with the user message, aggregated assistant text,
and tool events (`x-service-token` metadata). Fire-and-log: failures
warn but never fail or delay the chat. Errored/aborted turns and client
disconnects skip the append. Disabled when `SESSION_MANAGER_ADDR` is unset.

## Hydration

When `CreateSession` carries a caller-provided `session_id` and no live
in-memory session exists, the runtime fetches the durable transcript via
token-only `session.v1.GetTranscript` (5s deadline) and `src/hydrate.ts`
maps it into pi messages that seed the new agent's
`initialState.messages`: user/assistant text is restored faithfully;
`tool_call` + `tool_result` pairs are rebuilt as an assistant toolCall
message plus a toolResult message linked by synthetic `hydrated-<seq>`
ids; usage is zeroed. Fail-open: any error starts the session with empty
history. Sessions thus survive runtime restarts and TTL eviction;
disabled when `SESSION_MANAGER_ADDR` is unset.

## LLM config resolution

Per-request `llm.{api_key, base_url, model}` wins per-field over the env
fallback (`LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`). With no key
anywhere, Chat emits an `error` event ("LLM is not configured").

## Tools

The `ToolExecutor` interface exists with four tool definitions
(read/write/bash/edit), but only `NullExecutor` is wired — every call
fails with "tool execution unavailable: sandbox not connected".
SandboxExecutor (via sandbox-manager) is the next milestone.

## Environment

| Var | Default | Notes |
|-----|---------|-------|
| `PORT` | `50052` | |
| `MAX_SESSIONS` | `20` | over-cap → `RESOURCE_EXHAUSTED` |
| `SESSION_TTL_MINUTES` | `30` | idle eviction |
| `LLM_API_KEY` | — | optional env fallback |
| `LLM_BASE_URL` | `https://api.openai.com/v1` | |
| `LLM_MODEL` | `gpt-4o-mini` | |
| `SESSION_MANAGER_ADDR` | — | unset = no write-through/hydration |
| `SERVICE_TOKEN` | — | `x-service-token` for AppendTurn/GetTranscript |

Quirks (documented in code): grpc-js needs `call.emit("error", err)`
instead of `call.destroy(err)` to deliver status; Google's
OpenAI-compatible endpoint requires `compat: { supportsStore: false }`.

Repo: [Duke-ECE/agent-runtime](https://github.com/Duke-ECE/agent-runtime)
