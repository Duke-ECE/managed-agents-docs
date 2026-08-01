# Engineering Standards

How we build services in the managed-agents platform.

**Canonical source: [Duke-ECE/standards](https://github.com/Duke-ECE/standards)**
— rules (`AGENTS.md`), the Go service template (`templates/go-service/`),
and the mechanical rule checks (`scripts/check.sh`, wired into every
service's CI). This page is the summary; when the two ever disagree, the
repo wins.

## The shape of every Go service

**Vertical slices inside a hexagonal core:**

```
cmd/server/main.go            # the ONLY assembly point (composition root)
internal/
  transport/
    grpc|http/                # thin handlers, single error→status mapper
  <slice>/                    # one package per aggregate: types, service.go
                              # (rules), store.go (the port — owned by the
                              # slice), errors.go (domain errors)
  infrastructure/
    postgrest/                # port implementations over Supabase PostgREST
    memory/                   # in-memory implementations — REQUIRED
  config/                     # env vars with defaults
```

- Dependencies point inward: transport → slices ← infrastructure.
- Handlers do zero business logic; errors map in exactly one file.
- Every port has a memory implementation (zero-dep runs, parity reference).
- No orphans; slices flat until five, then `internal/domain/`.
- Escape valve: a pure pass-through proxy may collapse transport+slice
  until its first real rule appears.

## The rules in one breath

stdlib-only testing (bufconn/httptest fakes) · `gofmt`/`vet`/`test` +
`./scripts/check.sh` gates · go directive pinned to the 1.25 line,
`GOTOOLCHAIN=local` · PostgREST-with-service-key is the only database
pattern · tables RLS-locked with no policies · timestamped migration
versions · no secrets in git (k8s Secrets + `secretKeyRef`) · standard
CI/CD: test → docker → ghcr → kubectl rollout · `slog` for new logging ·
slog-first dependency policy · English comments, conventional commits.

Details, rationale, and the new-service checklist:
[standards/AGENTS.md](https://github.com/Duke-ECE/standards/blob/main/AGENTS.md).
