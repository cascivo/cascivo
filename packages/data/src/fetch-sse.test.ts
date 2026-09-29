import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchSSE, HttpError } from './fetch-sse'
import type { ServerSentEvent } from './sse'

function respondWith(response: Response): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(response),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function collect(source: AsyncIterable<ServerSentEvent>): Promise<string[]> {
  const data: string[] = []
  for await (const event of source) data.push(event.data)
  return data
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchSSE', () => {
  it('iterates the events of a text/event-stream response', async () => {
    respondWith(
      new Response('data: a\n\ndata: b\n\n', {
        headers: { 'content-type': 'text/event-stream; charset=utf-8' },
      }),
    )
    expect(await collect(fetchSSE('/stream'))).toEqual(['a', 'b'])
  })

  it('passes method, body and signal through, and asks for an event stream', async () => {
    const fetchMock = respondWith(
      new Response('data: ok\n\n', { headers: { 'content-type': 'text/event-stream' } }),
    )
    const controller = new AbortController()
    await collect(fetchSSE('/chat', { method: 'POST', body: '{"q":1}', signal: controller.signal }))
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"q":1}')
    expect(init.signal).toBe(controller.signal)
    expect(new Headers(init.headers).get('accept')).toBe('text/event-stream')
  })

  it('keeps a caller-provided accept header', async () => {
    const fetchMock = respondWith(
      new Response('data: ok\n\n', { headers: { 'content-type': 'text/event-stream' } }),
    )
    await collect(fetchSSE('/s', { headers: { accept: 'text/event-stream, */*' } }))
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(new Headers(init.headers).get('accept')).toBe('text/event-stream, */*')
  })

  it("throws HttpError carrying the server's JSON error message", async () => {
    respondWith(Response.json({ error: 'Unknown model' }, { status: 400 }))
    const error = await collect(fetchSSE('/chat')).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(HttpError)
    expect(error).toMatchObject({ status: 400, message: 'Unknown model' })
  })

  it('falls back to the status when the error body is not JSON', async () => {
    respondWith(new Response('<h1>Bad gateway</h1>', { status: 502 }))
    await expect(collect(fetchSSE('/chat'))).rejects.toMatchObject({
      status: 502,
      message: 'Request failed with status 502',
    })
  })

  it('rejects a 200 that is not an event stream, such as an HTML fallback page', async () => {
    respondWith(new Response('<!doctype html>', { headers: { 'content-type': 'text/html' } }))
    await expect(collect(fetchSSE('/typo'))).rejects.toThrow(
      'Expected a text/event-stream response, got "text/html"',
    )
  })

  it('does not fetch until iteration starts', () => {
    const fetchMock = respondWith(new Response(''))
    fetchSSE('/lazy')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
