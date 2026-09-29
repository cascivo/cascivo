import { formatSSE, HttpError } from '@cascivo/data'
import type { Api, JsonEndpoint, StreamEndpoint } from './contract'
import { compilePath, matchPath } from './path'
import type { PathParams } from './path'

export interface HandlerContext<P extends string, I, Env> {
  params: PathParams<P>
  /** The request body, already validated by the endpoint's `input` parser. */
  body: I
  request: Request
  /** The Worker's bindings (KV, D1, R2, AI, …), as passed to its `fetch`. */
  env: Env
  /** Aborted when the client goes away mid-stream. */
  signal: AbortSignal
}

/** What a JSON handler returns; an endpoint with no output (a 204) may return nothing. */
type HandlerResult<O> = [O] extends [undefined] ? void | Promise<void> : O | Promise<O>

export type Handlers<A extends Api, Env> = {
  readonly [K in keyof A]: A[K] extends JsonEndpoint<infer P, infer I, infer O>
    ? (context: HandlerContext<P, I, Env>) => HandlerResult<O>
    : A[K] extends StreamEndpoint<infer P, infer I, infer E>
      ? (context: HandlerContext<P, I, Env>) => AsyncIterable<E> | Promise<AsyncIterable<E>>
      : never
}

const encoder = new TextEncoder()

function json(body: unknown, status: number, headers?: HeadersInit): Response {
  return Response.json(body, headers === undefined ? { status } : { status, headers })
}

/**
 * Serves an API contract from a Worker (or any `fetch`-shaped server):
 *
 * ```ts
 * export default {
 *   fetch: createHandler<typeof api, Env>(api, {
 *     getNote: async ({ params, env }) => loadNote(env.DB, params.id),
 *     chat: async function* ({ body, env }) { yield* streamReply(env.AI, body) },
 *   }),
 * }
 * ```
 *
 * - The body is parsed with the endpoint's `input` before your handler runs; a parse
 *   failure is a 400 with the parser's message.
 * - Throw `HttpError(status, message)` for an expected failure (404, 403, …). Any other
 *   error is a 500 whose message is **not** sent to the client, and is logged instead.
 * - A stream handler returns an async iterable; each value is one `data` event, then
 *   `done`. An error mid-stream becomes an `error` event, since the status is already sent.
 * - An unknown path is a JSON 404; a known path with the wrong method is a 405.
 */
export function createHandler<A extends Api, Env = unknown>(
  api: A,
  handlers: Handlers<A, Env>,
): (request: Request, env: Env) => Promise<Response> {
  const table = Object.entries(api).map(([name, def]) => ({
    name,
    def,
    path: compilePath(def.path),
    handler: (handlers as Record<string, (context: unknown) => unknown>)[name],
  }))
  for (const entry of table) {
    if (typeof entry.handler !== 'function') {
      throw new Error(`createHandler: no handler for endpoint "${entry.name}"`)
    }
  }

  return async (request, env) => {
    const { pathname } = new URL(request.url)
    const allowed: string[] = []
    for (const entry of table) {
      const params = matchPath(entry.path, pathname)
      if (!params) continue
      if (entry.def.method !== request.method) {
        allowed.push(entry.def.method)
        continue
      }

      let body: unknown
      if (entry.def.input) {
        let raw: unknown
        try {
          raw = await request.json()
        } catch {
          return json({ error: 'Body must be valid JSON' }, 400)
        }
        try {
          body = entry.def.input(raw)
        } catch (error) {
          return json({ error: error instanceof Error ? error.message : 'Invalid body' }, 400)
        }
      }

      const abort = new AbortController()
      request.signal.addEventListener('abort', () => abort.abort(), { once: true })
      const context = { params, body, request, env, signal: abort.signal }

      try {
        const result = await entry.handler!(context)
        if (entry.def.kind === 'json') {
          return result === undefined ? new Response(null, { status: 204 }) : json(result, 200)
        }
        return sse(result as AsyncIterable<unknown>, abort)
      } catch (error) {
        return failure(error, `${request.method} ${pathname}`)
      }
    }
    if (allowed.length > 0) {
      return json({ error: `Method ${request.method} not allowed` }, 405, {
        allow: allowed.join(', '),
      })
    }
    return json({ error: `No endpoint for ${request.method} ${pathname}` }, 404)
  }
}

function failure(error: unknown, where: string): Response {
  if (error instanceof HttpError) return json({ error: error.message }, error.status)
  console.error(`Unhandled error in ${where}:`, error)
  return json({ error: 'Internal error' }, 500)
}

function sse(events: AsyncIterable<unknown>, abort: AbortController): Response {
  const iterator = events[Symbol.asyncIterator]()
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const next = await iterator.next()
        if (next.done) {
          controller.enqueue(encoder.encode(formatSSE('done', {})))
          controller.close()
        } else {
          controller.enqueue(encoder.encode(formatSSE('data', next.value)))
        }
      } catch (error) {
        const message = error instanceof HttpError ? error.message : 'The stream failed'
        if (!(error instanceof HttpError)) console.error('Unhandled error in stream:', error)
        controller.enqueue(encoder.encode(formatSSE('error', { message })))
        controller.close()
      }
    },
    async cancel() {
      abort.abort()
      await iterator.return?.()
    },
  })
  return new Response(body, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
    },
  })
}
