# Deployment

## Cluster

4-node kubeadm cluster (Kubernetes v1.34.9, containerd, Flannel) on Duke
VCM VMs; control plane `vcm-53796.vm.duke.edu`. Images live on
`ghcr.io/duke-ece/*`; every namespace that runs them has the `ghcr-pull`
imagePullSecret. ingress-nginx runs as a DaemonSet with `hostNetwork`
(every node serves 80/443); TLS via cert-manager Let's Encrypt.

## Workloads

| Deployment | Namespace | Replicas | Port | Ingress host |
|------------|-----------|----------|------|--------------|
| `react-template` (frontend) | default | 2 | 80 | `managed-agents.colab.duke.edu` |
| `managed-agents-backend` | default | 2 | 8080 | `api-managed-agent.colab.duke.edu` |
| `agent-runtime` | default | 1 | 50052 | — |
| `session-manager` | default | 2 | 50053 | — |
| `sandbox-manager` | pi-sandbox-system | 1 | 50051 | — |

Sandboxes themselves run in `pi-sandbox` (default-deny NetworkPolicy,
no service-account token); sandbox-manager's Role is scoped to pod
operations in that namespace only.

## Secrets

| Secret | Used by | Contents |
|--------|---------|----------|
| `ghcr-pull` | all | ghcr pull credentials |
| `supabase-service-role` | backend, session-manager | Supabase service key (`key`) |
| `session-service-token` | session-manager, agent-runtime | shared `x-service-token` |
| `agent-runtime-llm` | agent-runtime (optional) | env LLM fallback key |
| `*-tls` | ingress | cert-manager issued |

Secrets are created with `kubectl create secret` — never committed.

## CI/CD pipeline (every service repo)

1. **On PR + push to `main`**: build + vet/lint + test.
2. **On push to `main` only**: docker buildx → push
   `ghcr.io/duke-ece/<repo>:{sha,latest}` → write the `KUBE_CONFIG`
   secret to a kubeconfig → `kubectl apply -f k8s.yaml` →
   `kubectl set image … :<sha>` → wait for rollout.

Exceptions: `protos` (CI = buf lint/breaking/drift + `go build`; shipped
via Go module tags), `managed-agents-docs` (this site → GitHub Pages),
`standards`/`teamSkills` (no deploy).

## Supabase

Project `managed_agents` (Canada Central). Used for:

- **Auth** — email/password (GitHub OAuth planned). JWKS endpoint used
  by the backend; the CLI is linked in `managed-agents-backend` and
  `session-manager`.
- **Postgres** — `llm_providers`, `agent_sessions`, `agent_messages`,
  all RLS-locked to the service role. Services reach it via PostgREST
  with a dedicated secret API key.

Migrations live per-repo under `supabase/migrations/` with **timestamped
versions** (`YYYYMMDDHHMMSS_name.sql`) — plain counters collide across
repos and `db push` silently skips the loser.
