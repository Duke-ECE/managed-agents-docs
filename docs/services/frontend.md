# Frontend (managed-agents-frontend)

React 19 + Vite 7 + Tailwind 4 SPA ("AgentDeck" console), served by
nginx. Sign-in via Supabase (email/password; GitHub OAuth button exists
but the provider is not enabled yet in Supabase).

## Routes

`/login` is public; everything else sits behind an auth guard:
Dashboard, Sandboxes, Agents, Sessions, Tasks, Orchestrations, Chat.

**Only `/chat` talks to the real backend.** All other pages read mock
data (`src/mocks/`, simulated 350 ms delay) — migrating them to real
endpoints is planned work.

## The chat page

- Sessions + SSE via `src/lib/chat-api.ts` (manual SSE parsing over
  `fetch` — EventSource can't POST). Every request carries the Supabase
  access token; a 401 clears the local session and routes to `/login`.
- **Provider toggle**: Default (platform OpenRouter provider, no key
  needed) or Custom (any OpenAI-compatible endpoint with the user's own
  key, stored in browser localStorage only). Default mode omits `llm`
  from session creation so the backend injects the platform provider.
- Sessions are created lazily on the first message; tool events render
  inline; token usage shows on completion.

## Build-time environment

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are baked in via Docker
`--build-arg` (repo variables). `VITE_API_URL` defaults to the
production backend URL in code.

## Known stale names

Scaffolding leftovers: the k8s Deployment/Service and the ghcr image are
still called `react-template`. Harmless; rename when touching that
manifest next.

Repo: [Duke-ECE/managed-agents-frontend](https://github.com/Duke-ECE/managed-agents-frontend)
