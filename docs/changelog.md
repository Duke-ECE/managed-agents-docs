# Changelog

All notable changes to the managed-agents project are documented here.

## 2026-07-26 — Platform build-out: auth, durable sessions, standards

### Auth & accounts

- Supabase project `managed_agents` wired in: JWT auth (JWKS) on all
  `/api/sessions*` routes; `sub` becomes `user_id` end-to-end. Frontend
  login gate with email/password sign-in. Admin account provisioned.

### Chat product

- agent-runtime (TypeScript, pi agent core) serves `runtime.v1.AgentService`
  with SSE-bridged chat; the AgentDeck frontend's chat page is live —
  all other console pages remain mock.
- **Default LLM provider**: OpenRouter (`openai/gpt-oss-20b:free`) stored
  in Supabase `llm_providers` (RLS-locked), injected server-side by the
  backend when the user brings no key. Frontend Default/Custom provider
  toggle.

### Durable sessions

- New **session-manager** service (Go, :50053): owns `agent_sessions` /
  `agent_messages` via PostgREST; ownership enforced on every RPC;
  runtime write-through (`AppendTurn`) with a shared service token.
  Backend session lifecycle routed through it; new transcript endpoint
  `GET /api/sessions/:id/messages`. E2E verified (cross-user 403,
  token-less AppendTurn rejected).
- protos **v0.4.0**: `session.v1.SessionService` + adoptable `session_id`
  in `runtime.v1`.

### Platform hygiene

- [Duke-ECE/standards](https://github.com/Duke-ECE/standards) created:
  engineering rules + canonical Go service template; pointer `AGENTS.md`
  added to all Go repos.
- Docs site reorganized: architecture, per-service pages, contracts,
  deployment, operations runbook (this release).
- Backend rewritten from Express to Go/Gin earlier in the cycle;
  sandbox-manager + pooled single-use sandboxes landed (tool wiring into
  the runtime is the next milestone).

## 2026-07-21 — Initial platform bring-up

### Team skills (repo created by Weihao)

- Created [Duke-ECE/teamSkills](https://github.com/Duke-ECE/teamSkills) with the
  **VM-connection** skill: how agents connect to and operate the team's 4-node
  Duke VCM Kubernetes cluster over non-interactive SSH, plus the
  `ssh-key-uploader` Go tool for installing team members' SSH keys.
- Tagged the repo with topic `managed-agents`.

### Cluster infrastructure

- Verified the kubeadm cluster (v1.34.9, containerd 2.2.1, Flannel) — all 4 nodes Ready.
- Installed `docker.io` on the control plane for image builds.
- Set up the container registry workflow under the **Duke-ECE** org:
  `ghcr.io/duke-ece/*`, with a cluster-wide `ghcr-pull` imagePullSecret.
- Created a namespace-scoped `github-actions` ServiceAccount + RBAC
  (deployments/services/ingresses in `default`) for CI deploys.
- Installed **ingress-nginx** (Helm) as a DaemonSet with `hostNetwork: true` —
  all nodes serve ports 80/443; reverted a temporary
  `--service-node-port-range` change in favor of the standard Ingress pattern.
- Registered two domains (CNAME → control plane VM):
  `managed-agents.colab.duke.edu` and `api-managed-agent.colab.duke.edu`.

### Frontend — [Duke-ECE/managed-agents-frontend](https://github.com/Duke-ECE/managed-agents-frontend)

- Scaffolded a Vite + React app; multi-stage Dockerfile (node build → nginx).
- Deployed to the cluster (2 replicas, ClusterIP + Ingress).
- Full CI/CD: PR build check → image push to ghcr (`:<sha>` + `:latest`) →
  `kubectl apply` + rollout on every push to `main`.
- Frontend now calls the backend API and renders its response.
- Public: <http://managed-agents.colab.duke.edu>

### Backend — [Duke-ECE/managed-agents-backend](https://github.com/Duke-ECE/managed-agents-backend)

- New Express API service: `GET /api/health`, `GET /api/message`, CORS locked
  to the frontend origin.
- Same CI/CD pattern as the frontend; ghcr package auto-created by `GITHUB_TOKEN`.
- Public: <http://api-managed-agent.colab.duke.edu>

### Docs — this site

- Created [Duke-ECE/managed-agents-docs](https://github.com/Duke-ECE/managed-agents-docs):
  VitePress site deployed to GitHub Pages via Actions.
