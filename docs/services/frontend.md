# Frontend (managed-agents-frontend)

React 19 + Vite 7 + Tailwind 4 SPA ("AgentDeck" console), served by
nginx. Sign-in via Supabase: email/password, or GitHub OAuth with
deep-link restore (the intended path survives the OAuth round-trip).

## Routes

`/login` is public; everything else sits behind an auth guard:
Dashboard, Sandboxes, Agents, Sessions, Tasks, Orchestrations, Chat,
Admin.

**Only the Chat, Sessions and Admin pages talk to the real backend.**
All other pages read mock data (`src/mocks/`, simulated 350 ms delay) —
migrating them to real endpoints is planned work. Backend responses are
snake_case protojson (`UseProtoNames`), matching the session.v1 proto
field names.

## The Admin page

Whitelist management (`team_members`): list/add/remove members, pick
roles. The nav item appears only when `GET /api/me` reports `is_admin`;
the backend enforces admin regardless. Whitelisted members may use the
platform-default LLM provider; everyone else must configure their own
key (the chat settings panel hides "Default provider" for them).

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
- **Provider toggle**: Default (platform OpenRouter provider, no key
  needed) or Custom (any OpenAI-compatible endpoint with the user's own
  key, stored in browser localStorage only). Default mode omits `llm`
  from session creation so the backend injects the platform provider.
- Tool events render inline; token usage shows on completion.

## The Sessions console page

Reads the real session list (previously mocks) via
`src/lib/chat-api.ts`, with Open-in-chat and End actions per row.

## Build-time environment

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are baked in via Docker
`--build-arg` (repo variables). `VITE_API_URL` defaults to the
production backend URL in code.

## Known stale names

Scaffolding leftovers: the k8s Deployment/Service and the ghcr image are
still called `react-template`. Harmless; rename when touching that
manifest next.

Repo: [Duke-ECE/managed-agents-frontend](https://github.com/Duke-ECE/managed-agents-frontend)
