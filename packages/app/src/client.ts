import { fetchSSE, HttpError } from '@cascivo/data'
import type { Api, CallArgs, CallArgsTuple, JsonEndpoint, StreamEndpoint } from './contract'
import { buildPath } from './path'
import type { PathParams } from './path'

export type Client<A extends Api> = {
  readonly [K in keyof A]: A[K] extends JsonEndpoint<infer P, infer I, infer O>
    ? (...args: CallArgsTuple<P, I>) => Promise<O>
    : A[K] extends StreamEndpoint<infer P, infer I, infer E>
      ? (...args: CallArgsTuple<P, I>) => AsyncGenerator<E, void, undefined>
      : never
}

export interface ClientOptions {
  /** Prefix for every path, e.g. `https://api.example.com`. Default: same origin. */
  baseUrl?: string
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (typeof body === 'object' && body !== null) {
      const { error } = body as { error?: unknown }
      if (typeof error === 'string') return error
    }
  } catch {
    // Not JSON; the status is all there is.
  }
  return `Request failed with status ${response.status}`
}

/** Reads one string field from a JSON event payload, for the protocol's own events. */
function field(data: string, name: string): string {
  try {
    const parsed: unknown = JSON.parse(data)
    if (typeof parsed === 'object' && parsed !== null) {
      const value = (parsed as Record<string, unknown>)[name]
      if (typeof value === 'string') return value
    }
  } catch {
    // Fall through to the generic message.
  }
  return 'The stream failed'
}

/**
 * A typed client for an API contract. Every response is run through the endpoint's
 * `output`/`event` parser before your code sees it — the network is not trusted just
 * because the contract is shared.
 *
 * ```ts
 * const client = createClient(api)
 * const note = await client.getNote({ params: { id } })
 * for await (const token of client.chat({ body: { messages } })) draft.value += token.text
 * ```
 *
 * Non-2xx responses throw `HttpError` (from `@cascivo/data`) with the server's message.
 */
export function createClient<A extends Api>(api: A, options: ClientOptions = {}): Client<A> {
  const baseUrl = options.baseUrl ?? ''

  function request(
    def: { method: string; path: string },
    args: CallArgs<string, unknown> | undefined,
  ): [string, RequestInit] {
    const url = baseUrl + buildPath(def.path, (args?.params ?? {}) as PathParams<string>)
    const headers = new Headers(args?.headers)
    const init: RequestInit = { method: def.method, headers }
    if (args?.body !== undefined) {
      headers.set('content-type', 'application/json')
      init.body = JSON.stringify(args.body)
    }
    if (args?.signal) init.signal = args.signal
    return [url, init]
  }

  const client: Record<string, unknown> = {}
  for (const [name, def] of Object.entries(api)) {
    if (def.kind === 'json') {
      client[name] = async (args?: CallArgs<string, unknown>) => {
        const [url, init] = request(def, args)
        const response = await fetch(url, init)
        if (!response.ok) throw new HttpError(response.status, await errorMessage(response))
        const raw: unknown = response.status === 204 ? undefined : await response.json()
        return def.output(raw)
      }
    } else {
      client[name] = async function* (args?: CallArgs<string, unknown>) {
        const [url, init] = request(def, args)
        for await (const message of fetchSSE(url, init)) {
          if (message.event === 'data') yield def.event(JSON.parse(message.data))
          else if (message.event === 'error') throw new Error(field(message.data, 'message'))
          else if (message.event === 'done') return
        }
        throw new Error('The stream ended before the server finished it')
      }
    }
  }
  return client as Client<A>
}
