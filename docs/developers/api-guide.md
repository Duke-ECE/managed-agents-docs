# API guide

Use this guide to call a hosted agent from your application's server. The
console also has an [API guide tab](https://managed-agents.colab.duke.edu/keys?tab=docs)
beside your keys; this page is the shareable documentation for the same flow.

**Base URL:** `https://api-managed-agent.colab.duke.edu`

## Authentication

Create an API key in the [console](https://managed-agents.colab.duke.edu/keys)
and store its `ma_sk_...` secret on your server. Send it with every session
request:

```http
Authorization: Bearer <your API key>
```

API keys can call `/api/sessions` and its subroutes. Creating or changing
agents, managing keys, reading `/api/me`, and admin endpoints require a
Supabase login token instead. An API key inherits its owner's access to
agents and the platform LLM, but each new session must specify an existing
`agent_id` and cannot override the agent's LLM settings.

## 1. Create a session

The agent must be yours or a shared platform agent. The built-in Default
assistant has ID `a0000000-0000-0000-0000-000000000001` and requires
platform LLM access. For a custom agent, use `GET /api/agents` with your
Supabase login token to find its ID; the console does not currently display
agent IDs. You cannot use an API key to call `GET /api/agents`.

```bash
export MANAGED_AGENTS_API_KEY='ma_sk_...'
export AGENT_ID='your-agent-id'

curl -sS -X POST 'https://api-managed-agent.colab.duke.edu/api/sessions' \
  -H "Authorization: Bearer $MANAGED_AGENTS_API_KEY" \
  -H 'Content-Type: application/json' \
  -d "{\"agent_id\":\"$AGENT_ID\"}"
```

The JSON response contains a `session_id`. Save it for the next calls.
Requests with a missing or inaccessible agent ID fail; an API key cannot
create a session without an agent ID.

## 2. Stream a reply

```bash
export SESSION_ID='the-session-id-from-step-1'

curl -N -X POST "https://api-managed-agent.colab.duke.edu/api/sessions/$SESSION_ID/messages" \
  -H "Authorization: Bearer $MANAGED_AGENTS_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"content":"Hello"}'
```

The response is `text/event-stream`. Parse it as Server-Sent Events. Each
frame has an `event` name and a JSON `data` value. Handle `text_delta` by
appending its `delta` to the visible reply; `done` marks a completed turn.
The stream may also contain `tool_call`, `tool_result`, or `error` events.

```text
event: text_delta
data: {"delta":"Hello"}

event: done
data: {"input_tokens":"10","output_tokens":"20"}
```

Send another message to the same path to continue that session. If a stream
disconnects before `done`, read the transcript before retrying: the API does
not deduplicate repeated messages, and closing the HTTP connection does not
guarantee cancellation.

## 3. Read the transcript

```bash
curl -sS "https://api-managed-agent.colab.duke.edu/api/sessions/$SESSION_ID/messages?limit=50" \
  -H "Authorization: Bearer $MANAGED_AGENTS_API_KEY"
```

The response contains `messages` and `has_more`. Use `before_seq` with the
oldest message's sequence number to load earlier messages. Sessions and
transcripts belong to the API key's owner.

## Session endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/sessions` | Create a session with an existing `agent_id` |
| `GET` | `/api/sessions?limit=&offset=` | List your sessions |
| `POST` | `/api/sessions/:id/messages` | Send a message; receive an SSE stream |
| `GET` | `/api/sessions/:id/messages?limit=&before_seq=` | Read the transcript |
| `PATCH` | `/api/sessions/:id/title` | Rename a session |
| `DELETE` | `/api/sessions/:id` | End a session |
| `DELETE` | `/api/sessions/:id?purge=true` | Delete the session and transcript |

`GET /api/keys`, `POST /api/keys`, and `DELETE /api/keys/:id` are **not** session endpoints. They
require a Supabase login token; an API key cannot list, create, or revoke
other keys.

## Errors

| Status | Meaning |
| --- | --- |
| `400` | Invalid request, including a missing `agent_id` for an API key |
| `401` | Missing or invalid bearer credential |
| `403` | Access denied, including missing permission to use the platform LLM |
| `404` | Agent or session not found, or not visible to this account |
| `410` | Session has ended and cannot be resumed |
| `429` | Session capacity reached |

For a detailed account of the backend and internal services, see the
[backend guide](../services/backend) and [architecture](../architecture).
