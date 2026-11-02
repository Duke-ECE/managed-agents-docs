# Chat SDK for third-party apps

The TypeScript/JavaScript SDK lets a server-side integration chat with an agent that its owner has already created on the Managed Agents platform. It can create and manage conversations, stream replies, retrieve history, and rename sessions. Agent creation is done on the platform, not through the SDK.

## Get a key

Sign in to the Managed Agents Console and open **API Keys**. Create a named key for each integration, copy it when shown, and store it as a server secret. The platform stores a hash and cannot show the full key again. Revoke a key from the same page to stop new requests immediately.

The key acts as the issuing user. It can access that user's existing agents and sessions, and no other users' private agents or conversations. It only authenticates session routes. It cannot create or edit agent templates, manage keys, or reach admin routes.

## Chat from a server

The SDK package is currently a local draft under `managed-agents-sdk/`; it is not published yet. After the backend migration and package release:

To try the local draft against an upgraded backend, run `npm ci --ignore-scripts`
and `npm run build` inside that repository, then set `MANAGED_AGENTS_API_KEY`
and `MANAGED_AGENTS_AGENT_ID` and run `node examples/quickstart.mjs`.

```ts
import { ManagedAgentsClient } from '@duke-ece/managed-agents-sdk'

const client = new ManagedAgentsClient({
  baseUrl: 'https://api-managed-agent.colab.duke.edu',
  apiKey: process.env.MANAGED_AGENTS_API_KEY!,
})

const sessionId = await client.createSession('existing-agent-id')
for await (const frame of client.chat(sessionId, 'Hello')) {
  if (frame.event === 'text_delta') {
    process.stdout.write((frame.data as { delta: string }).delta)
  }
}
await client.renameSession(sessionId, 'Support conversation')
```

Keep the key on the server; do not put it in a browser bundle. Name the session after its first reply because the current runtime may generate a title for that first turn. You can give each session a different name.

The SDK's `chat` stream exposes `text_delta`, `tool_call`, `tool_result`, and `done` events. The accepted `clientRequestId` appears on every event. After an uncertain disconnect, reuse that ID with the same message to avoid creating a duplicate turn. A rejected HTTP request raises `ApiError`; a streamed `error` event or a stream that ends before `done` raises `StreamError` with the accepted `clientRequestId`. `AbortSignal` stops reading the stream; call `cancel` to request cancellation of a durable turn.

Version 1 is text chat. The runtime currently returns `tool execution unavailable: sandbox not connected` for its built-in read/write/bash/edit tools. The SDK forwards any tool-related events but does not execute tools or claim they succeeded.
