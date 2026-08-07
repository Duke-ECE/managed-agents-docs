# Changelog

All notable changes to the managed-agents project are documented here.

## 2026-08-07 — Agent templates (P2: frontend)

- **managed-agents-frontend@c0940c4** — new Agents page (`/agents`):
  real CRUD against `/api/agents` in a drawer form. The `platform_default`
  mode is gated on `/api/me` (`can_use_platform_llm`); the API key field
  is write-only (edit + empty = keep the stored key); tools are four
  checkboxes where all-checked submits `[]` (= all tools). The chat page
  gains an agent picker on new chats: a selected template governs the
  session (local LLM settings are not sent) and shows as a name chip;
  existing sessions resolve `agent_id` to a name best-effort — a deleted
  template just hides the badge and never blocks the chat.

## 2026-08-07 — Agent templates (P1: contracts + backend)

User-owned, reusable agent configs: name, description, system prompt,
`llm_mode` (`platform_default` | `custom`) + LLM triple, tools whitelist.
A session references a template by id (reference semantics — re-resolved
at create/resume, never snapshotted; a deleted template degrades to a
template-less resume).

- **protos@v0.6.0** — additive: `runtime.v1.CreateSessionRequest` gains
  `system_prompt` + `tools`; `session.v1` gains `Session.agent_id` +
  `CreateSessionRequest.agent_id`.
- **session-manager@5810ade** — nullable `agent_id` column on
  `agent_sessions`, threaded through CreateSession and all Session
  responses.
- **agent-runtime@837f253** — CreateSession applies a caller system
  prompt (same path for fresh and hydrated sessions) and filters the
  built-in read/write/bash/edit tools to the whitelist; unknown tool
  names are INVALID_ARGUMENT before any session state exists.
- **managed-agents-backend@d3b8b9c, @e333bb9** — new `agents` table
  (RLS, service-role only) + `internal/agent` slice +
  `GET/POST /api/agents`, `GET/PATCH/DELETE /api/agents/:id` (user-scoped;
  `llm_api_key` is write-only — reads expose `has_api_key`). CreateSession
  and resume resolve the template: a custom template supplies its LLM
  triple, a platform_default template passes the whitelist gate like a
  key-less request. One production-found fix: a nil tools whitelist
  marshalled to JSON null and violated the column's not-null constraint
  (now sent as `[]`).
- E2E verified live: template → session → pirate persona answers →
  runtime restart → resume re-applies the template → template edited to a
  knight persona → next resume answers as a knight.

Frontend UI (Agents page, chat-time agent picker) is P2, not yet built.

## 2026-08-07 — Session titles + frontend polish

### Auto session titles

- **protos@v0.5.0** — additive: `session.v1.Session.title` + token-gated
  `SetTitle` RPC.
- **session-manager@f45b5d1** — `title` column on `agent_sessions`;
  `SetTitle` (service-token only, 120-rune cap, does not touch
  `last_active`, allowed on ended sessions).
- **agent-runtime@5247197, @5d8c48f, @9c3c699** — a session that began
  empty gets an LLM-generated title after its first completed turn
  (fire-and-log, never blocks chat; hydrated sessions are never titled).
  Two production-found fixes: reasoning models (gpt-oss) starved on a
  32-token budget → 1024, and one delayed retry for free-tier 429s.
- **managed-agents-backend@2cf55c1+** — protos bump; `title` flows
  through ListSessions automatically.

### Frontend polish (managed-agents-frontend@3e577f6)

- Assistant messages render GFM markdown (react-markdown; lockfile
  stays on registry.npmjs.org).
- Route-level code splitting (chat/sessions/admin lazy): main chunk
  back under 500 kB.
- Composer becomes a Stop button while streaming; token usage shows
  under finished assistant messages; dead topbar buttons removed;
  sidebar + Sessions page display the auto-generated title.
- Earlier @7d99c4e — console stripped to real pages only (mocks
  deleted, `/` → `/chat`).

## 2026-08-07 — Team whitelist: open sign-in, gated platform LLM

### Access control

- **managed-agents-backend@bec9894** — sign-in is open (email/password +
  GitHub OAuth), but the platform default LLM provider is now gated by
  the new `team_members` whitelist (RLS, service-role only): a browser
  that sends no API key must be whitelisted, otherwise
  `POST /api/sessions` answers 403 `platform LLM access not granted:
  configure your own API key or ask an admin`. User-supplied keys always
  pass. New `internal/access/` slice + `infrastructure/teammembers`
  PostgREST adapter; new endpoints `GET /api/me` and admin-only
  `GET/POST/DELETE /api/admin/members`. Seeds `weihao.li@duke.edu` and
  `admin@managed-agents.local` as admins, `tester@` as member. Verified
  live: stranger 403 → admin adds → 200 → admin removes → 403 again.

### Frontend

- **managed-agents-frontend@dd056f4** — GitHub OAuth sign-in button with
  deep-link restore (intended path survives the OAuth round-trip); new
  Admin page for whitelist management (nav item only for `is_admin`);
  chat settings hide the Default provider when `/api/me` says the
  account has no platform access. Earlier @d5cd353 — transcripts are
  cached in memory with stale-while-revalidate (instant session
  revisits) plus sidebar hover prefetch.

Note: the GitHub OAuth provider is enabled in Supabase separately (OAuth
App credentials via `supabase config push`); the frontend button reports
the provider error inline until then.

## 2026-08-01 — Session hydration: chats survive runtime restarts

### Session hydration & resume

- **agent-runtime@819da0a** — hydration: `CreateSession` with a
  caller-provided `session_id` fetches the durable transcript via
  `session.v1.GetTranscript` (`x-service-token` metadata, 5s deadline,
  fail-open to empty history) and seeds the pi Agent's
  `initialState.messages` through the new `src/hydrate.ts` mapper —
  user/assistant text restored faithfully, `tool_call` + `tool_result`
  pairs rebuilt as an assistant toolCall message + toolResult message
  linked by synthetic `hydrated-<seq>` ids, usage zeroed. `SessionWriter`
  renamed `SessionClient` (now AppendTurn + GetTranscript). Sessions
  survive runtime restarts and TTL eviction.
- **managed-agents-backend@8cc8603, @d10e8dd** — resume-on-404: when
  runtime `Chat` returns `NOT_FOUND` before any SSE frame (live session
  lost), the backend verifies ownership via session-manager `GetSession`,
  refuses with **410** if the record is `ended` (ended is terminal),
  re-creates the runtime session under the same id (`ALREADY_EXISTS`
  from a concurrent resume tolerated) and retries the turn once.
  Mid-stream `NOT_FOUND` stays fatal. Domain errors gained
  `KindFailedPrecondition` → HTTP 410.
- **session-manager@21af506** — `AppendTurn` rejects appends to `ended`
  sessions with `FAILED_PRECONDITION` (new `KindFailedPrecondition`
  domain error → `codes.FailedPrecondition`). Ended sessions remain
  readable; the `GetTranscript` owner path is unchanged.

### Frontend

- **managed-agents-frontend@60f258a** — ChatGPT-style chat: left sidebar
  fed by the real `GET /api/sessions` (new/select/end), session id in
  the URL (`/chat/:id`), history loaded from
  `GET /api/sessions/:id/messages` on open (410/404/403 get dedicated
  banners), refresh restores the conversation. The Sessions console page
  moved from mocks to real data with Open-in-chat and End actions. Only
  the Chat + Sessions pages talk to the real backend; the rest still
  mock. Backend marshals protojson with `UseProtoNames` → snake_case
  responses.

### Verification

- **managed-agents-backend@ac31037** — `test/live-smoke.sh`: env-driven
  (`SUPABASE_URL`/`SUPABASE_ANON_KEY`/`TEST_EMAIL`/`TEST_PASSWORD`,
  optional `RESTART_RUNTIME=1` for a kubectl rollout restart), verifies
  create → plant code word → restart → recall (hydration) → transcript
  depth → end → refusal. Green against production.

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
