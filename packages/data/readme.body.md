Client data primitives for cascivo apps. They use only web APIs and have zero dependencies, so they run the same in the browser, in Node, and in a Cloudflare Worker.

> **Early.** This package was extracted from a real app, [`apps/examples/chat`](../../apps/examples/chat), a streaming AI chat on Workers AI. It ships only what that app proved it needed. More primitives land here when another real app needs them. The version stays `0.x` until then.

## Install

```sh
pnpm add @cascivo/data
```

## Server-sent events over `fetch`

`EventSource` only makes GET requests. A chat request has a body, so it is a POST, and `EventSource` cannot send it. `fetchSSE` accepts any method, headers and body. It cancels through an `AbortSignal`, like any `fetch`.

```ts
import { fetchSSE, HttpError } from '@cascivo/data'

const controller = new AbortController()
try {
  for await (const event of fetchSSE('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal: controller.signal, // controller.abort() stops the stream
  })) {
    if (event.event === 'token') draft.value += JSON.parse(event.data).text
  }
} catch (error) {
  if (error instanceof HttpError) console.error(error.status, error.message)
}
```

`fetchSSE` reports two failures clearly:

- A non-2xx response throws `HttpError`. Its `message` is the server's JSON `error` or `message` field when the server sent one.
- A 200 response that is not `text/event-stream` throws an error. This happens, for example, when an SPA fallback serves `index.html` for a mistyped path. Without the check, the stream would look empty and give no error.

`fetchSSE` does not reconnect. When a stream ends or fails, your code gets the error and decides whether to retry. To stream long-lived GET notifications where the browser should reconnect for you, use `EventSource`.

## Parse any stream: `parseSSE`

`parseSSE` reads the SSE wire format from any `ReadableStream<Uint8Array>`. It follows the [WHATWG parsing rules](https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation):

- CR, LF and CRLF line endings, even when a CRLF is split across chunks
- multi-line `data`
- comments
- `id` carried forward to later events
- numeric `retry`
- a leading BOM
- an unterminated final event, which is discarded

If you stop iterating early, the upstream stream is cancelled.

Because `parseSSE` takes a plain stream, a server can use it too. A Cloudflare Worker can re-encode a Workers AI stream into its own protocol with `formatSSE`:

```ts
import { parseSSE, formatSSE } from '@cascivo/data'

const upstream = await env.AI.run(model, { messages, stream: true })
const encoder = new TextEncoder()
const body = new ReadableStream({
  async start(controller) {
    for await (const { data } of parseSSE(upstream)) {
      if (data === '[DONE]') break
      const { response } = JSON.parse(data)
      controller.enqueue(encoder.encode(formatSSE('token', { text: response })))
    }
    controller.enqueue(encoder.encode(formatSSE('done', {})))
    controller.close()
  },
})
return new Response(body, { headers: { 'content-type': 'text/event-stream' } })
```

## API

| Export            | Signature                                                                            |
| ----------------- | ------------------------------------------------------------------------------------ |
| `fetchSSE`        | `(input: RequestInfo \| URL, init?: RequestInit) => AsyncGenerator<ServerSentEvent>` |
| `parseSSE`        | `(body: ReadableStream<Uint8Array>) => AsyncGenerator<ServerSentEvent>`              |
| `formatSSE`       | `(event: string, data: unknown) => string`                                           |
| `HttpError`       | `Error` with a `status: number`                                                      |
| `ServerSentEvent` | `{ event: string; data: string; id: string; retry?: number }`                        |
