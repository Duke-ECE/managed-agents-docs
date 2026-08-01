# Engineering Standards

How we build services in the managed-agents platform. The machine-readable
source of truth (plus the service template) lives in
[Duke-ECE/standards](https://github.com/Duke-ECE/standards) — this page is
the human-readable version.

## Go project layout

**Vertical slices inside a hexagonal core.** All Go services follow one
layout (copy `templates/go-service/` from the standards repo when
starting something new):

```
cmd/server/main.go            # the ONLY assembly point (composition root)
internal/
  transport/
    grpc|http/                # server construction, thin handlers, single
                              # error→status mapper; HTTP: routes.go + middleware.go
  <slice>/                    # one package per aggregate: types, service.go
                              # (rules), store.go (the port — owned by the
                              # slice), errors.go (domain errors)
  infrastructure/
    postgrest/                # port implementations over Supabase PostgREST
    memory/                   # in-memory implementations — REQUIRED
  config/                     # env vars with defaults
```

Key rules:

- Dependencies point inward: transport → slices ← infrastructure.
  Ports are declared in the slice that consumes them.
- Handlers do zero business logic; domain errors map to statuses in
  exactly one file per transport.
- Explicit server construction, graceful shutdown, SSE-aware timeouts
  (`ReadHeaderTimeout` yes; blanket `WriteTimeout` never).
- Every port has a memory implementation (zero-dep local runs; the
  parity reference: same IDs, ordering, errors across backends).
- No orphans: every package is wired into the running binary. Slices sit
  flat under `internal/` until there are more than five, then group
  under `internal/domain/`.

## Testing and gates

- stdlib `testing` only — no testify, no gomock. Small interface seams
  (`Store`, `Fetcher`) faked in tests; gRPC over `bufconn`; external HTTP
  APIs over `httptest`. No testcontainers.
- Gates before every push: `gofmt -l .`, `go vet ./...`, `go test ./...`.
- **Toolchain trap**: dev Macs auto-upgrade Go. After any `go get`/`go mod
  tidy`, the `go` directive must stay on the 1.25 line; verify with
  `GOTOOLCHAIN=local go build/vet/test ./...`.

## Contracts (protos)

- All gRPC contracts live in
  [Duke-ECE/protos](https://github.com/Duke-ECE/protos) (buf v2, lint
  `STANDARD`, breaking policy `FILE`). Additive → same `vN` package;
  breaking → new package version.
- `gen/go/` is committed generated code — regenerate with `buf generate`,
  commit together with the `.proto` change, tag `vX.Y.Z`, bump consumers.
- agent-runtime vendors `.proto` files via `npm run sync-proto` pinned to a
  tag — never hand-edit vendored copies.

## Data access (Supabase)

- Services reach Postgres via **PostgREST with a service key** — not pgx or
  database/sql. One access pattern platform-wide.
- Service-owned tables: RLS enabled, **no policies** (service role only).
  API keys never reach the browser.
- Several repos push migrations to one shared project → **timestamped
  migration versions** (`YYYYMMDDHHMMSS_name.sql`); plain counters collide
  and `db push` silently skips the loser.

## Secrets and env

- No secrets in git — no `.env` files, no keys in manifests.
- Runtime secrets: k8s Secrets via `secretKeyRef`. CI secrets: GitHub repo
  secrets (`KUBE_CONFIG`, `GITHUB_TOKEN`).
- Every env var documented in the repo README (name, default, unset
  behavior). Unset optional features degrade gracefully.

## CI/CD

Every service repo has the same workflow: build + vet + test on PRs; on push
to `main` additionally docker buildx → `ghcr.io/duke-ece/<repo>:{sha,latest}`
→ `kubectl apply -f k8s.yaml` → `kubectl set image … :<sha>` → rollout wait.

## TypeScript quick rules

- `tsc --strict` is the gate; ESM with `.js` extensions on relative imports.
- After `npm install` on a China-network machine:
  `grep -c npmmirror package-lock.json` must be 0 before committing.
