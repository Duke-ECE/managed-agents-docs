# Operations

Runbook-style notes for operating the platform. Cluster access: kubectl
with the team kubeconfig (see `teamSkills/VM-connection`).

## Health checks

```sh
# HTTP
curl https://api-managed-agent.colab.duke.edu/api/health

# gRPC (port-forward, then list via reflection)
kubectl port-forward svc/session-manager 50053:50053 &
grpcurl -plaintext localhost:50053 list
kubectl port-forward svc/sandbox-manager 50051:50051 -n pi-sandbox-system &
grpcurl -plaintext localhost:50051 list

# workloads
kubectl get pods -n default
kubectl get pods -n pi-sandbox
```

## Verifying a deploy

Every push to `main` rolls out automatically. To confirm:

```sh
gh run list -R Duke-ECE/<repo> -L 1
kubectl rollout status deployment/<name> --timeout=180s
kubectl get deploy <name> -o jsonpath='{.spec.template.spec.containers[0].image}'
# image tag must equal the pushed commit sha
```

## Common incidents

**Intermittent 401s after a backend rollout.**
A pod that starts during a DNS hiccup never fetched the JWKS and 401s
its share of traffic. Fix: `kubectl rollout restart
deployment/managed-agents-backend` once DNS is healthy. Permanent fix
(readiness gate on JWKS fetch) is on the debt list.

**Local results look wrong / stale responses.**
A stale local process squatting on a port silently shadows
port-forwards and new binaries. Check first:
`lsof -iTCP:<port> -sTCP:LISTEN`.

**`go mod tidy` broke the Docker build.**
Dev Macs auto-upgrade Go; tidy can bump `go.mod`'s directive past the
`golang:1.25-alpine` image. Keep the directive on the 1.25 line and
verify everything with `GOTOOLCHAIN=local go build/vet/test ./...`.

**Lockfile points at npmmirror.**
After `npm install` on a China-network machine:
`grep -c npmmirror package-lock.json` must be 0 before committing;
regenerate with the default registry otherwise.

**Supabase migration silently not applied.**
Two repos pushed the same counter version (`0001`). Use timestamped
migration names; check applied versions with
`supabase db query --linked "select version, name from supabase_migrations.schema_migrations order by 1;"`.

## Useful Supabase commands

```sh
# run SQL against the linked project (from a repo with supabase/ linked)
supabase db query --linked "select id, status, user_id from agent_sessions order by created_at desc limit 10;"

# apply migrations
supabase db push

# list API keys (hashes only; full values need the Management API with ?reveal=true)
supabase projects api-keys --project-ref <ref>
```

## grpcurl cheat sheet

```sh
# create a sandbox (v1, ops)
grpcurl -plaintext -d '{"image":"busybox:1.36"}' localhost:50051 sandbox.v1.SandboxManagerService/CreateSandbox

# append a turn WITHOUT the service token → expect UNAUTHENTICATED
grpcurl -plaintext -d '{"session_id":"sess-…"}' localhost:50053 session.v1.SessionService/AppendTurn
```
