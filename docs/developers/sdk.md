# JavaScript SDK

Use the Managed Agents SDK from a Node.js server to chat with an existing agent. The SDK creates sessions, streams replies, and reads transcripts. Agent setup and API key creation happen in the console or CLI before your application starts.

## Before you start

- Use Node.js 22 or newer.
- Create an [API key](https://managed-agents.colab.duke.edu/keys) and copy its one-time `ma_sk_...` secret. Keep it in a server-side environment variable; never put it in browser code or a repository.
- Choose an existing agent ID. The built-in Default assistant is `a0000000-0000-0000-0000-000000000001`. Your account must have platform LLM access to use it. For your own agent, retrieve its ID with `GET /api/agents` using a Supabase login token; a platform API key cannot list agents.

The SDK has not been released to npm yet. Install a pinned commit from the [SDK source repository](https://github.com/Duke-ECE/managed-agents-sdk):

```sh
npm install 'git+https://github.com/Duke-ECE/managed-agents-sdk.git#62eba6ea735066f7894f8d351386b737f87eecc1'
```

## Send two messages

Save this as `chat.mjs` in your Node.js project:

```js
import { ApiError, ManagedAgentsClient, StreamError } from '@duke-ece/managed-agents-sdk'

const client = new ManagedAgentsClient({
  baseUrl: 'https://api-managed-agent.colab.duke.edu',
  apiKey: process.env.MANAGED_AGENTS_API_KEY,
})

let sessionId
try {
  sessionId = await client.createSession(process.env.MANAGED_AGENTS_AGENT_ID)
  console.log(`Session: ${sessionId}`)

  for (const message of ['Hello', 'What did I just say?']) {
    process.stdout.write('Agent: ')
    for await (const item of client.chat(sessionId, message)) {
      if (item.event === 'text_delta' && typeof item.data?.delta === 'string') {
        process.stdout.write(item.data.delta)
      }
    }
    process.stdout.write('\n')
  }

  const history = await client.getTranscript(sessionId)
  console.log(`Recent transcript messages: ${history.messages.length}`)
} catch (error) {
  if (error instanceof ApiError) console.error(`HTTP ${error.status}: ${error.message}`)
  else if (error instanceof StreamError) console.error(`Chat stream: ${error.message}`)
  else console.error(error)
  if (sessionId) console.error(`Inspect session ${sessionId} before retrying.`)
  process.exitCode = 1
}
```

Run it with a server-side key and agent ID:

```sh
export MANAGED_AGENTS_API_KEY='<one-time key secret>'
export MANAGED_AGENTS_AGENT_ID='a0000000-0000-0000-0000-000000000001'
node chat.mjs
```

Both messages use the same `sessionId`. Save that ID if you want to continue later; call `client.chat(sessionId, message)` again. `getTranscript` returns a page of messages and a `has_more` flag. The SDK also offers `listSessions`, `renameSession`, and `endSession`.

## Errors and retries

`ApiError` means the HTTP request was rejected; its `status` distinguishes an invalid key (`401`), inaccessible agent or missing platform LLM access (`403`), and other [API errors](./api-guide#errors). `StreamError` means the server sent an SSE error or the stream ended before `done`. The current API does not deduplicate chat submissions, so read the transcript before resending a message after an interrupted stream. Closing the connection does not guarantee that the agent stopped.

The SDK passes through `tool_call` and `tool_result` events; it does not execute tools. Its optional durable mode depends on an API contract that is not deployed yet, so leave `durable` unset for current production use.

For endpoint details and raw HTTP examples, see the [API guide](./api-guide).
