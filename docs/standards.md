# Engineering Standards

How we build services in the managed-agents platform. The machine-readable
source of truth (plus the service template) lives in
[Duke-ECE/standards](https://github.com/Duke-ECE/standards) — this page is
the human-readable version.

## Go project layout

All Go services follow one layout (copy `templates/go-service/` from the
standards repo when starting something new):

```
cmd/server/main.go        # env parsing, wiring, graceful shutdown ONLY — no logic
internal/server/server.go # server construction: grpc.Server/http.Server, timeouts
internal/server/routes.go # HTTP services: the endpoint table (RegisterRoutes)
internal/<domain>/        # business logic + RPC handlers, one package per domain
internal/store/           # persistence behind an interface (delete if stateless)
supabase/migrations/      # schema, timestamped versions
k8s.yaml                  # Deployment + Service; env from Secrets via secretKeyRef
Dockerfile                # golang:1.25-alpine → alpine:3.21, non-root uid 10001
Makefile                  # build / vet / test / run — thin wrappers, no magic
```

Key rules:

- `cmd/server`, not `cmd/api`; handlers never live in `main`.
- Explicit server construction (`NewServer()`), never bare
  `http.ListenAndServe`; graceful shutdown on SIGINT/SIGTERM everywhere.
- **SSE-aware timeouts**: `ReadHeaderTimeout` yes; blanket `WriteTimeout`
  never (it kills long-lived SSE/gRPC streams).
- `/health` reports dependency status; a sick dependency is a 200 with
  detail, never `log.Fatal`.

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
