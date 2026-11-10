# Frontend (managed-agents-frontend)

React 19 + Vite 7 + Tailwind 4 SPA (PolyAgent Console), served by
nginx. Sign-in via Supabase: email/password, or GitHub OAuth with
deep-link restore (the intended path survives the OAuth round-trip).

## Routes

`/` is the public product homepage; `/login` is public. `/console` is the
signed-in Overview page for starting a chat and reopening recent sessions. The guarded
console routes are Chat (`/chat`, `/chat/:id`), Sessions (`/sessions`), Agents
(`/agents`), API Keys (`/keys`), and admin-only LLM Access (`/admin`). A direct
login defaults to `/console`; guarded deep links return to their intended
route after sign-in. Older `/keys?tab=docs` links redirect to the public
[API guide](../developers/api-guide). Unknown frontend paths show a 404 page.

**Every remaining page talks to the real backend** — the mock pages
(Dashboard, Sandboxes, Agents, Tasks, Orchestrations, SessionDetail)
and `src/mocks/` were deleted (2026-08-07); their designs stay
recoverable via git history and the qoder-preview repo for when they
return with real backends. Backend responses are snake_case protojson
(`UseProtoNames`), matching the session.v1 proto field names.

## The LLM Access page

Whitelist management (`team_members`): list/add/remove members, pick
roles. The nav item appears only when `GET /api/me` reports `is_admin`;
the backend enforces admin regardless. Whitelisted members may use the
platform-default LLM provider; everyone else must configure their own
key in a private agent template.

## The chat page

ChatGPT-style: a left sidebar fed by the real `GET /api/sessions`
(new/select/end a session) plus `/chat` → `/chat/:id` routing.

- Sessions + SSE via `src/lib/chat-api.ts` (manual SSE parsing over
  `fetch` — EventSource can't POST). Every request carries the Supabase
  access token; a 401 clears the local session and routes to `/login`.
- Sessions are created lazily on the first message, which adopts the new
  session id in the URL; opening `/chat/:id` loads the durable
  transcript (`GET /api/sessions/:id/messages`) and continues streaming
  into the same view, so a refresh restores the conversation. 410
  (ended), 404 and 403 get dedicated banners.
- Choose an agent when starting a conversation. Provider and model settings
  come from that agent's template.
- Tool calls and results appear before the final answer in expandable rows
  and remain visible when the transcript is reopened. Token usage appears
  on completion.

## Find a session

Overview shows recent activity. On the Sessions page, search by
title or session ID. Search loads older pages on demand. Open a matching
session to read its transcript.

The Expo app has its own [mobile guide](./mobile).

## Build-time environment

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are baked in via Docker
`--build-arg` (repo variables). `VITE_API_URL` defaults to the
production backend URL in code.

## Known stale names

Scaffolding leftovers: the k8s Deployment/Service and the ghcr image are
still called `react-template`. Harmless; rename when touching that
manifest next.

Repo: [Duke-ECE/managed-agents-frontend](https://github.com/Duke-ECE/managed-agents-frontend)
