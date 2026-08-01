# Managed Agents

A Duke ECE team project: a platform where browser users chat with LLM
agents, deployed on a self-managed Kubernetes cluster running on four
Duke VCM virtual machines.

## Live endpoints

| What | URL |
|------|-----|
| Frontend (AgentDeck console) | <https://managed-agents.colab.duke.edu> |
| Backend API | <https://api-managed-agent.colab.duke.edu> |
| Docs (this site) | <https://duke-ece.github.io/managed-agents-docs/> |

## What it does today

- **Chat with an LLM agent** from the browser over a live SSE stream.
  Sign in with email/password (Supabase auth); sessions are private to
  their owner.
- **Zero-config chat**: a platform default provider (OpenRouter
  `openai/gpt-oss-20b:free`) is injected server-side when the user brings
  no API key. Users can alternatively point the agent at any
  OpenAI-compatible endpoint with their own key.
- **Durable sessions**: every session and every chat turn is persisted
  (Supabase Postgres) by the session-manager service — ownership is
  enforced there, and transcripts are readable via API.
- **Sandboxed tool execution** (infrastructure ready): sandbox-manager
  runs pooled, single-use Kubernetes sandboxes with a gRPC `Execute`
  API. Wiring it into the agent runtime is the next milestone.

## Repositories

| Repo | What |
|------|------|
| [managed-agents-frontend](https://github.com/Duke-ECE/managed-agents-frontend) | React SPA console (chat is live; other pages mock) |
| [managed-agents-backend](https://github.com/Duke-ECE/managed-agents-backend) | Go/Gin HTTP→gRPC proxy, auth, default LLM provider |
| [agent-runtime](https://github.com/Duke-ECE/agent-runtime) | TypeScript gRPC server hosting pi agent sessions |
| [session-manager](https://github.com/Duke-ECE/session-manager) | Go gRPC service: durable sessions + privilege |
| [sandbox-manager](https://github.com/Duke-ECE/sandbox-manager) | Go gRPC service: pooled single-use k8s sandboxes |
| [protos](https://github.com/Duke-ECE/protos) | All gRPC contracts (buf, tagged releases) |
| [standards](https://github.com/Duke-ECE/standards) | Engineering rules + Go service template |
| [managed-agents-docs](https://github.com/Duke-ECE/managed-agents-docs) | This site |
| [teamSkills](https://github.com/Duke-ECE/teamSkills) | Cluster ops + team coordination skills |

## Infrastructure

| Piece | Detail |
|-------|--------|
| Cluster | 4 × Duke VCM VMs, kubeadm (Kubernetes v1.34.9), containerd, Flannel |
| Registry | `ghcr.io/duke-ece/*` with a `ghcr-pull` imagePullSecret |
| Ingress | ingress-nginx DaemonSet with `hostNetwork` — every node serves 80/443 |
| TLS | cert-manager, Let's Encrypt (`letsencrypt-prod` ClusterIssuer) |
| Auth & DB | Supabase project `managed_agents` (Canada Central) |
| CI/CD | GitHub Actions per repo: test → docker → ghcr → `kubectl` rollout |
