# Developer Guide

PolyAgent hosts reusable agents that your application can call from its
own server. You configure an agent in the console, create an API key, then
create sessions and stream replies through the HTTP API.

## Before you start

1. [Open the console](https://managed-agents.colab.duke.edu/console). Sign in if prompted.
2. Create or clone an agent on the [Agents page](https://managed-agents.colab.duke.edu/agents).
   Choose its instructions, model, and allowed tools. You will need its
   **agent ID** for the API call. The console does not currently display IDs;
   `GET /api/agents` with your Supabase login token returns them. The built-in
   Default assistant has ID `a0000000-0000-0000-0000-000000000001`.
3. Create a key on the [API Keys page](https://managed-agents.colab.duke.edu/keys).
   Copy the `ma_sk_...` secret when it appears; it is shown only once.
4. Store the key on your application server. Never put it in browser code or
   a public repository.

The [JavaScript SDK guide](./sdk) shows a Node.js integration. The [API guide](./api-guide)
gives copyable HTTP requests for the first session, streamed message, and transcript read.

The built-in assistant uses the platform LLM. Your account needs platform
LLM access to use it; otherwise create an agent with your own LLM key.

## How the integration works

```text
Your app → your server → PolyAgent API → hosted agent
                                  ↓
                         session and transcript
```

Your server sends the API key as a Bearer token. The browser talks to your
server, which decides how to present the conversation. Each session has a
`session_id` that you keep to continue the conversation or read its history.

An API key can call session endpoints on behalf of its owner. Agent and key
management require the owner's console login; an API key cannot create agents
or other keys. A session created with an API key must name an existing
`agent_id` and uses that agent's LLM configuration.

## More documentation

- [JavaScript SDK](./sdk) — install the client, stream two turns, and handle errors.
- [API guide](./api-guide) — requests, SSE events, endpoint list, and common errors.
- [Architecture](../architecture) — how the backend, runtime, session manager,
  and sandbox manager fit together.
- [Service guides](../services/) — implementation details for platform maintainers.
