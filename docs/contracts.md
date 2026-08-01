# Contracts

All gRPC contracts live in
[Duke-ECE/protos](https://github.com/Duke-ECE/protos) (buf v2). Generated
Go code is committed (`gen/go/` — never hand-edit); consumers pin a
semver git tag. Current tag: **v0.4.0**.

## Packages

### `runtime.v1` — AgentService (agent-runtime)

| RPC | Purpose |
|-----|---------|
| `CreateSession` | Start an agent session; optional `session_id` adoption (session-manager owns ids) + optional `LlmConfig` fallback |
| `EndSession` | End a live session (ownership enforced when `user_id` set) |
| `ListSessions` | Live in-memory sessions, filtered by `user_id` when set |
| `Chat` | Server-streaming turn; oneof events below |

Chat events: `text_delta`, `tool_call`, `tool_result`, `error`,
`done` (carries token usage). The backend translates each into a
same-named SSE event — these names are a three-repo contract
(proto ↔ backend ↔ frontend).

### `session.v1` — SessionService (session-manager)

| RPC | Purpose |
|-----|---------|
| `CreateSession` / `GetSession` / `ListSessions` / `EndSession` | User-scoped lifecycle over durable records; ownership enforced |
| `AppendTurn` | Runtime write-through after a completed turn (service token) |
| `GetTranscript` | Ordered `TurnMessage`s; owner or service token |

`TurnMessage.role`: `user` | `assistant` | `tool_call` | `tool_result`;
`content_json` holds the role-specific payload.

### `sandbox.v1` — SandboxManagerService (sandbox-manager)

`CreateSandbox` / `DeleteSandbox` — ops/debug lifecycle only.

### `sandbox.v2` — SandboxExecutorService (sandbox-manager)

`Execute` — one synchronous tool call in an anonymous single-use
sandbox. Response: `exit_code`, `stdout`, `stderr`, `truncated`.

## Versioning rules

- Lint: `STANDARD` (`*Service` names, `XxxResponse` replies).
- Breaking policy: `FILE` — additive changes go in the same `vN`
  package; breaking changes get a new package (see `sandbox/v1` vs `v2`).
- After additive merges: tag (`vX.Y.Z`), then bump Go consumers with
  `go get github.com/Duke-ECE/protos@<tag>` and re-vendor agent-runtime's
  copies with `npm run sync-proto` (pinned to the same tag).

## Error mapping (backend → HTTP)

`NOT_FOUND→404`, `PERMISSION_DENIED→403`, `FAILED_PRECONDITION→410`,
`RESOURCE_EXHAUSTED→429`, else `500`. Session-manager create failure
during `POST /api/sessions` → `502`.
