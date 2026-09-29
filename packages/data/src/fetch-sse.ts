import { parseSSE } from './sse'
import type { ServerSentEvent } from './sse'

/** A non-2xx response. `message` is the server's JSON `error`/`message` field when it sent one. */
export class HttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

/**
 * `fetch` a server-sent event stream and iterate its events.
 *
 * Unlike `EventSource` it takes any method, headers and body — a chat request is a POST —
 * and it cancels through `init.signal` like any fetch. It does not reconnect: a stream that
 * ends or fails is reported to the caller, who decides whether to retry.
 *
 * Throws `HttpError` on a non-2xx status, and a plain `Error` when the response is not
 * `text/event-stream` (a proxy or an SPA fallback answering with HTML, say).
 *
 * @example
 * ```ts
 * for await (const event of fetchSSE('/api/chat', { method: 'POST', body, signal })) {
 *   if (event.event === 'token') draft.value += JSON.parse(event.data).text
 * }
 * ```
 */
export async function* fetchSSE(
  input: RequestInfo | URL,
  init: RequestInit = {},
): AsyncGenerator<ServerSentEvent, void, undefined> {
  const headers = new Headers(init.headers)
  if (!headers.has('accept')) headers.set('accept', 'text/event-stream')

  const response = await fetch(input, { ...init, headers })
  if (!response.ok) throw new HttpError(response.status, await errorMessage(response))

  const type = response.headers.get('content-type') ?? ''
  if (!type.toLowerCase().startsWith('text/event-stream')) {
    await response.body?.cancel()
    throw new Error(`Expected a text/event-stream response, got "${type || 'no content type'}"`)
  }
  if (!response.body) throw new Error('The event stream response has no body')

  yield* parseSSE(response.body)
}

async function errorMessage(response: Response): Promise<string> {
  const fallback = `Request failed with status ${response.status}`
  try {
    const body: unknown = await response.json()
    if (typeof body === 'object' && body !== null) {
      const { error, message } = body as { error?: unknown; message?: unknown }
      if (typeof error === 'string') return error
      if (typeof message === 'string') return message
    }
  } catch {
    // Not a JSON body; the status is all there is to report.
  }
  return fallback
}
