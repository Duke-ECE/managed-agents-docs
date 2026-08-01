# sandbox-manager

Go 1.25 gRPC server (:50051) owning all sandbox pods in the cluster.
Itself stateless — sandbox state lives on pod labels and annotations.

## Two services

- **`sandbox.v1.SandboxManagerService`** — `CreateSandbox`/`DeleteSandbox`,
  ops/debug lifecycle (ids `sb-<hex>`, TTL reaper).
- **`sandbox.v2.SandboxExecutorService`** — one RPC, `Execute`: run a
  single tool call synchronously in an anonymous, **single-use** sandbox
  that is destroyed immediately after. This is the API the agent-runtime
  will consume.

## The pool

A controller (5s tick) keeps `POOL_SIZE` warm sandboxes. Pod label
`pool` tracks the phase: `pending → ready → in-use → deleted`. On
startup, orphaned `in-use` pods are deleted (recovery). Pool pods run
`sleep infinity`; `Execute` claims a ready pod (up to 10s wait,
`RESOURCE_EXHAUSTED` at capacity) and always deletes it afterwards.

## Execute semantics

- Tools map to command prefixes (built-ins `shell` → `/bin/sh -c`,
  `python` → `python3 -c`); unknown tool → `InvalidArgument`.
- Timeout: `EXEC_TIMEOUT_SECONDS` (default 60, capped 300) →
  `DeadlineExceeded`.
- Output: stdout/stderr each truncated at `MAX_OUTPUT_BYTES`; non-zero
  exit is a result (`exit_code`), not a transport error.
- Exec transport: Kubernetes `pods/exec` SPDY.

## Isolation

Sandboxes run in namespace `pi-sandbox` with a default-deny
NetworkPolicy (ingress + egress) and `automountServiceAccountToken:
false`. The manager runs in `pi-sandbox-system`; its Role allows only
pods CRUD + `pods/exec` + `pods/log` in `pi-sandbox`.

## Environment

| Var | Default |
|-----|---------|
| `SANDBOX_NAMESPACE` | `pi-sandbox` |
| `DEFAULT_IMAGE` | `busybox:1.36` (stand-in sandbox-worker image) |
| `MAX_SANDBOXES` | `10` |
| `DEFAULT_TTL_SECONDS` | `900` |
| `POOL_SIZE` | `3` |
| `EXEC_TIMEOUT_SECONDS` | `60` |
| `MAX_OUTPUT_BYTES` | `1048576` |
| `TOOLS` | JSON tool→prefix map |

Repo: [Duke-ECE/sandbox-manager](https://github.com/Duke-ECE/sandbox-manager)
