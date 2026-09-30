import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { createClient, createHandler, defineApi, endpoint, HttpError, stream } from './api'

interface Note {
  id: string
  text: string
}

function parseNote(raw: unknown): Note {
  if (typeof raw === 'object' && raw !== null) {
    const { id, text } = raw as Record<string, unknown>
    if (typeof id === 'string' && typeof text === 'string') return { id, text }
  }
  throw new Error('Not a note')
}
function parseText(raw: unknown): { text: string } {
  if (typeof raw === 'object' && raw !== null) {
    const { text } = raw as Record<string, unknown>
    if (typeof text === 'string' && text.length > 0) return { text }
  }
  throw new Error('text must be a non-empty string')
}

const api = defineApi({
  getNote: endpoint({ method: 'GET', path: '/api/notes/:id', output: parseNote }),
  saveNote: endpoint({
    method: 'PUT',
    path: '/api/notes/:id',
    input: parseText,
    output: parseNote,
  }),
  listNotes: endpoint({ method: 'GET', path: '/api/notes', output: (raw) => raw as unknown[] }),
  deleteNote: endpoint({ method: 'DELETE', path: '/api/notes/:id', output: () => undefined }),
  echo: stream({ method: 'POST', path: '/api/echo', input: parseText, event: parseText }),
})

interface Env {
  notes: Map<string, string>
}

function serve(
  env: Env,
  overrides: Partial<Parameters<typeof createHandler<typeof api, Env>>[1]> = {},
) {
  const handle = createHandler<typeof api, Env>(api, {
    getNote: ({ params, env }) => {
      const text = env.notes.get(params.id)
      if (text === undefined) throw new HttpError(404, `No note ${params.id}`)
      return { id: params.id, text }
    },
    saveNote: ({ params, body, env }) => {
      env.notes.set(params.id, body.text)
      return { id: params.id, text: body.text }
    },
    listNotes: ({ env }) => [...env.notes.keys()],
    deleteNote: ({ params, env }) => {
      env.notes.delete(params.id)
    },
    echo: async function* ({ body }) {
      for (const word of body.text.split(' ')) yield { text: word }
    },
    ...overrides,
  })
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
    handle(new Request(new URL(input, 'http://localhost'), init), env),
  )
  return handle
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('defineApi', () => {
  it('refuses two endpoints on the same method and path', () => {
    expect(() =>
      defineApi({
        a: endpoint({ method: 'GET', path: '/x', output: String }),
        b: endpoint({ method: 'GET', path: '/x', output: String }),
      }),
    ).toThrow('both GET /x')
  })

  it('refuses an input on a GET endpoint', () => {
    expect(() => endpoint({ method: 'GET', path: '/x', input: String, output: String })).toThrow(
      'a GET request has no body',
    )
  })
})

describe('createClient + createHandler', () => {
  it('types calls from the contract', () => {
    const client = createClient(api)
    expectTypeOf(client.getNote).parameters.toEqualTypeOf<
      [
        args: { params: { id: string } } & { body?: undefined } & {
          signal?: AbortSignal
          headers?: HeadersInit
        },
      ]
    >()
    expectTypeOf(client.getNote).returns.resolves.toEqualTypeOf<Note>()
    // Compile-time only: a wrong param name, a missing body and a body on a GET all fail.
    const typeErrors = () => {
      // @ts-expect-error — the path declares `id`, not `noteId`
      void client.getNote({ params: { noteId: 'x' } })
      // @ts-expect-error — saveNote declares an input, so `body` is required
      void client.saveNote({ params: { id: 'x' } })
      // @ts-expect-error — getNote takes no body
      void client.getNote({ params: { id: 'x' }, body: { text: 'x' } })
    }
    expect(typeErrors).toBeTypeOf('function')
    expectTypeOf(client.listNotes)
      .parameter(0)
      .toEqualTypeOf<
        | ({ params?: {} } & { body?: undefined } & { signal?: AbortSignal; headers?: HeadersInit })
        | undefined
      >()
  })

  it('round-trips JSON endpoints with params and bodies', async () => {
    serve({ notes: new Map() })
    const client = createClient(api)
    expect(await client.saveNote({ params: { id: 'a b' }, body: { text: 'hi' } })).toEqual({
      id: 'a b',
      text: 'hi',
    })
    expect(await client.getNote({ params: { id: 'a b' } })).toEqual({ id: 'a b', text: 'hi' })
    expect(await client.listNotes()).toEqual(['a b'])
    expect(await client.deleteNote({ params: { id: 'a b' } })).toBeUndefined()
  })

  it("turns HttpError into that status, and the client throws it with the server's message", async () => {
    serve({ notes: new Map() })
    const error = await createClient(api)
      .getNote({ params: { id: 'x' } })
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(HttpError)
    expect(error).toMatchObject({ status: 404, message: 'No note x' })
  })

  it("rejects a body that fails the input parser with 400 and the parser's message", async () => {
    const handle = serve({ notes: new Map() })
    const response = await handle(
      new Request('http://localhost/api/notes/1', { method: 'PUT', body: '{"text":""}' }),
      { notes: new Map() },
    )
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'text must be a non-empty string' })
    const bad = await handle(
      new Request('http://localhost/api/notes/1', { method: 'PUT', body: '{nope' }),
      { notes: new Map() },
    )
    expect(bad.status).toBe(400)
  })

  it('hides unexpected errors behind a 500 and logs them', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    serve(
      { notes: new Map() },
      {
        getNote: () => {
          throw new Error('db password is hunter2')
        },
      },
    )
    const error = await createClient(api)
      .getNote({ params: { id: '1' } })
      .catch((e: unknown) => e)
    expect(error).toMatchObject({ status: 500, message: 'Internal error' })
    expect(log).toHaveBeenCalled()
    log.mockRestore()
  })

  it('answers 404 for an unknown path and 405 with Allow for a wrong method', async () => {
    const handle = serve({ notes: new Map() })
    const missing = await handle(new Request('http://localhost/api/nope'), { notes: new Map() })
    expect(missing.status).toBe(404)
    const wrong = await handle(new Request('http://localhost/api/notes/1', { method: 'POST' }), {
      notes: new Map(),
    })
    expect(wrong.status).toBe(405)
    expect(wrong.headers.get('allow')).toBe('GET, PUT, DELETE')
  })

  it('validates responses on the client, not just on the way out', async () => {
    serve({ notes: new Map() }, { getNote: () => ({ id: 1 }) as unknown as Note })
    await expect(createClient(api).getNote({ params: { id: '1' } })).rejects.toThrow('Not a note')
  })

  it('streams events from an async iterable', async () => {
    serve({ notes: new Map() })
    const words: string[] = []
    for await (const event of createClient(api).echo({ body: { text: 'one two three' } })) {
      words.push(event.text)
    }
    expect(words).toEqual(['one', 'two', 'three'])
  })

  it('surfaces an error thrown mid-stream as a client error', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    serve(
      { notes: new Map() },
      {
        echo: async function* () {
          yield { text: 'first' }
          throw new HttpError(429, 'Slow down')
        },
      },
    )
    const seen: string[] = []
    const error = await (async () => {
      for await (const event of createClient(api).echo({ body: { text: 'x' } }))
        seen.push(event.text)
    })().catch((e: unknown) => e)
    expect(seen).toEqual(['first'])
    expect(error).toMatchObject({ message: 'Slow down' })
    log.mockRestore()
  })

  it('refuses a handler map that misses an endpoint', () => {
    expect(() =>
      createHandler(api, {} as Parameters<typeof createHandler<typeof api, Env>>[1]),
    ).toThrow('no handler for endpoint "getNote"')
  })
})
