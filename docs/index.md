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
  Sign in with email/password or GitHub (Supabase auth); sessions are
  private to their owner.
- **Agent templates**: named, reusable configs (system prompt, LLM,
  tools whitelist) under `/agents`. Two built-in platform templates
  (Default assistant, Pi coding agent) are visible to everyone and
  read-only — clone one to customize. A session references its template;
  the template is re-resolved on resume, and the system prompt is also
  persisted in the transcript so deleting a template never orphans the
  persona.
- **Zero-config chat**: a platform default provider (OpenRouter
  `openai/gpt-oss-20b:free`) is injected server-side for whitelisted
  members who bring no API key. Anyone can alternatively point the agent
  at any OpenAI-compatible endpoint with their own key. The whitelist is
  managed by admins on the LLM Access page.
- **Durable sessions**: every session and every chat turn is persisted
  (Supabase Postgres) by the session-manager service — ownership is
  enforced there, transcripts are readable via API, and sessions resume
  automatically after runtime restarts (transcript hydration).
- **Sandboxed tool execution** (infrastructure ready): sandbox-manager
  runs pooled, single-use Kubernetes sandboxes with a gRPC `Execute`
  API. Wiring it into the agent runtime is the next milestone.

## Repositories

| Repo | What |
|------|------|
| [managed-agents-frontend](https://github.com/Duke-ECE/managed-agents-frontend) | React SPA console (Chat, Sessions, Agents, LLM Access) |
| [managed-agents-backend](https://github.com/Duke-ECE/managed-agents-backend) | Go/Gin HTTP→gRPC proxy, auth, whitelist, agent templates, default LLM provider |
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
