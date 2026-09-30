/** One dispatched server-sent event. */
export interface ServerSentEvent {
  /** The `event:` field, `'message'` when absent. */
  event: string
  /** Every `data:` line of the event, joined by `\n`. */
  data: string
  /** The last `id:` seen on the stream so far (it persists across events, per spec). */
  id: string
  /** The `retry:` field, only when this event carried a valid one. */
  retry?: number
}

/**
 * Parse a server-sent event stream from any byte stream, following the WHATWG
 * event-stream interpretation rules: CR, LF and CRLF line endings (even split across
 * chunks), multi-line `data`, comments, `id` carried forward, numeric `retry`, a leading BOM,
 * and an unterminated final event discarded.
 *
 * `EventSource` only does GET. This reads the same wire format from a `fetch` body, a
 * Cloudflare Workers AI stream, or any `ReadableStream<Uint8Array>` — so a server that
 * consumes an upstream stream and a browser that consumes the server can share one parser.
 * Stopping iteration early (`break`, a throw) cancels the underlying stream.
 *
 * https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation
 */
export async function* parseSSE(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<ServerSentEvent, void, undefined> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let first = true
  let event = ''
  let data = ''
  let hasData = false
  let lastId = ''
  let retry: number | undefined
  let finished = false

  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true })
      if (first && buffer.length > 0) {
        if (buffer.charCodeAt(0) === 0xfeff) buffer = buffer.slice(1)
        first = false
      }

      let start = 0
      for (let i = 0; i < buffer.length; i++) {
        const ch = buffer[i]
        if (ch !== '\n' && ch !== '\r') continue
        // A lone `\r` at the end of a chunk may be the first half of `\r\n`: wait for more.
        if (ch === '\r' && i === buffer.length - 1 && !done) break
        const line = buffer.slice(start, i)
        if (ch === '\r' && buffer[i + 1] === '\n') i++
        start = i + 1

        if (line === '') {
          if (hasData) {
            const message: ServerSentEvent = { event: event || 'message', data, id: lastId }
            if (retry !== undefined) message.retry = retry
            yield message
          }
          event = ''
          data = ''
          hasData = false
          retry = undefined
          continue
        }
        if (line.startsWith(':')) continue

        const colon = line.indexOf(':')
        const field = colon === -1 ? line : line.slice(0, colon)
        let fieldValue = colon === -1 ? '' : line.slice(colon + 1)
        if (fieldValue.startsWith(' ')) fieldValue = fieldValue.slice(1)

        if (field === 'event') event = fieldValue
        else if (field === 'data') {
          data = hasData ? `${data}\n${fieldValue}` : fieldValue
          hasData = true
        } else if (field === 'id') {
          if (!fieldValue.includes('\0')) lastId = fieldValue
        } else if (field === 'retry') {
          if (/^\d+$/.test(fieldValue)) retry = Number(fieldValue)
        }
      }
      buffer = buffer.slice(start)
      // Per spec, an event not terminated by a blank line before EOF is discarded.
      if (done) {
        finished = true
        return
      }
    }
  } finally {
    // A consumer that stops early (`break`, a thrown error) must not leave the upstream
    // connection open — cancelling propagates to the fetch body or the Workers AI stream.
    if (!finished) await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}

/**
 * Encode one event in the SSE wire format, with `data` serialised as JSON. The inverse of
 * what `parseSSE` reads, for the server side of a stream.
 */
export function formatSSE(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}
