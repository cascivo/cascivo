import type { PathParams } from './path'

/**
 * Turns an untrusted value into a `T` or throws. Anything with this shape works — a
 * hand-written guard, or a schema library's `parse` (`NoteSchema.parse`).
 */
export type Parser<T> = (raw: unknown) => T

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** A request/response endpoint: JSON in (optional), JSON out. */
export interface JsonEndpoint<P extends string, I, O> {
  readonly kind: 'json'
  readonly method: Method
  readonly path: P
  /** Validates the request body on the server. Absent: the endpoint takes no body. */
  readonly input?: Parser<I> | undefined
  /** Validates the response on the client. */
  readonly output: Parser<O>
}

/** A streaming endpoint: JSON in (optional), a server-sent event stream of `E` out. */
export interface StreamEndpoint<P extends string, I, E> {
  readonly kind: 'stream'
  readonly method: Method
  readonly path: P
  readonly input?: Parser<I> | undefined
  /** Validates each streamed event on the client. */
  readonly event: Parser<E>
}

export type AnyEndpoint =
  | JsonEndpoint<string, unknown, unknown>
  | StreamEndpoint<string, unknown, unknown>

export type Api = Readonly<Record<string, AnyEndpoint>>

function checkBody(method: Method, path: string, hasInput: boolean): void {
  if (hasInput && method === 'GET') {
    throw new Error(`GET ${path} declares an input, but a GET request has no body`)
  }
}

/**
 * A JSON endpoint. Omit `input` for an endpoint without a body:
 *
 * ```ts
 * getNote: endpoint({ method: 'GET', path: '/api/notes/:id', output: parseNote })
 * ```
 */
export function endpoint<P extends string, O, I = undefined>(definition: {
  method: Method
  path: P
  input?: Parser<I>
  output: Parser<O>
}): JsonEndpoint<P, I, O> {
  checkBody(definition.method, definition.path, definition.input !== undefined)
  return { kind: 'json', ...definition }
}

/**
 * A streaming endpoint; the server yields events and the client iterates them:
 *
 * ```ts
 * chat: stream({ method: 'POST', path: '/api/chat', input: parseChatRequest, event: parseToken })
 * ```
 */
export function stream<P extends string, E, I = undefined>(definition: {
  method: Method
  path: P
  input?: Parser<I>
  event: Parser<E>
}): StreamEndpoint<P, I, E> {
  checkBody(definition.method, definition.path, definition.input !== undefined)
  return { kind: 'stream', ...definition }
}

/**
 * The contract both sides import. Put it in a file with no server-only code
 * (`src/api.ts`), import it from the Worker for `createHandler` and from the app for
 * `createClient`, and a change to either side that breaks the other is a type error.
 */
// The constraint is deliberately loose. With `A extends Api`, every inline `endpoint({ … })`
// call gets `AnyEndpoint` as its contextual return type, TypeScript infers its path as
// `string` from that, and every handler loses its typed params. `createClient` and
// `createHandler` still require `A extends Api`, so a non-endpoint fails to compile there.
export function defineApi<A extends Readonly<Record<string, object>>>(api: A): A {
  const seen = new Map<string, string>()
  for (const [name, def] of Object.entries(api as Api)) {
    if (def.kind !== 'json' && def.kind !== 'stream') {
      throw new Error(`"${name}" is not an endpoint; build it with endpoint() or stream()`)
    }
    const key = `${def.method} ${def.path}`
    const other = seen.get(key)
    if (other) throw new Error(`Endpoints "${other}" and "${name}" are both ${key}`)
    seen.set(key, name)
  }
  return api
}

/** `params` is required exactly when the path declares params. */
type ParamsArg<P extends string> = keyof PathParams<P> extends never
  ? { params?: PathParams<P> }
  : { params: PathParams<P> }

/** `body` is required exactly when the endpoint declares an input. */
type BodyArg<I> = [I] extends [undefined] ? { body?: undefined } : { body: I }

export type CallArgs<P extends string, I> = ParamsArg<P> &
  BodyArg<I> & {
    signal?: AbortSignal
    headers?: HeadersInit
  }

/** A call's argument list: optional when nothing in it is required. */
export type CallArgsTuple<P extends string, I> = keyof PathParams<P> extends never
  ? [I] extends [undefined]
    ? [args?: CallArgs<P, I>]
    : [args: CallArgs<P, I>]
  : [args: CallArgs<P, I>]
