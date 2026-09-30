import { describe, expect, it } from 'vitest'
import worker from '../worker/index'
import type { AiBinding } from '../worker/chat'
import { createMockAi } from '../worker/mock-ai'
import { parseSSE } from '@cascivo/data'
import { DEFAULT_MODEL, LIMITS, parseChatRequest } from '../src/lib/protocol'

const ai = createMockAi({ delayMs: 0 })

function post(body: unknown, env: { AI: AiBinding } = { AI: ai }): Promise<Response> {
  return worker.fetch(
    new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    env,
  )
}

const valid = { model: DEFAULT_MODEL, messages: [{ role: 'user', content: 'hi' }] }

describe('POST /api/chat', () => {
  it('streams data events and ends with done', async () => {
    const response = await post(valid)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toMatch(/^text\/event-stream/)

    const events = []
    for await (const event of parseSSE(response.body!)) events.push(event)
    expect(events.at(-1)?.event).toBe('done')
    const text = events
      .filter((e) => e.event === 'data')
      .map((e) => (JSON.parse(e.data) as { text: string }).text)
      .join('')
    expect(text).toContain('You said: "hi"')
  })

  it('never forwards the model-specific payload shape', async () => {
    const response = await post(valid)
    const raw = await response.text()
    expect(raw).not.toContain('"response"')
    expect(raw).not.toContain('[DONE]')
  })

  it('turns an upstream failure into a 502 before streaming', async () => {
    const failing: AiBinding = {
      run: () => Promise.reject(new Error('Capacity exceeded')),
    }
    const response = await post(valid, { AI: failing })
    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: 'Capacity exceeded' })
  })

  it('rejects invalid JSON with 400', async () => {
    const response = await post('{not json')
    expect(response.status).toBe(400)
  })

  it("rejects an invalid body with 400 and the parser's message", async () => {
    const response = await post({ model: '@cf/evil/model', messages: [] })
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Unknown model' })
  })

  it('rejects GET with 405', async () => {
    const response = await worker.fetch(new Request('http://localhost/api/chat'), { AI: ai })
    expect(response.status).toBe(405)
  })

  it('returns 404 JSON for unknown API routes', async () => {
    const response = await worker.fetch(new Request('http://localhost/api/nope'), { AI: ai })
    expect(response.status).toBe(404)
  })
})

describe('parseChatRequest', () => {
  const cases: [string, unknown][] = [
    ['a non-object', 42],
    ['an unknown model', { ...valid, model: '@cf/evil/model' }],
    ['no messages', { model: DEFAULT_MODEL, messages: [] }],
    ['a system message', { model: DEFAULT_MODEL, messages: [{ role: 'system', content: 'x' }] }],
    ['blank content', { model: DEFAULT_MODEL, messages: [{ role: 'user', content: '  ' }] }],
    [
      'an assistant last turn',
      { model: DEFAULT_MODEL, messages: [{ role: 'assistant', content: 'x' }] },
    ],
    [
      'an oversized message',
      {
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: 'x'.repeat(LIMITS.maxMessageChars + 1) }],
      },
    ],
    [
      'too many messages',
      {
        model: DEFAULT_MODEL,
        messages: Array.from({ length: LIMITS.maxMessages + 1 }, () => ({
          role: 'user',
          content: 'x',
        })),
      },
    ],
  ]

  for (const [name, input] of cases) {
    it(`rejects ${name}`, () => {
      expect(() => parseChatRequest(input)).toThrow()
    })
  }

  it('drops fields it does not know', () => {
    const parsed = parseChatRequest({
      ...valid,
      messages: [{ role: 'user', content: 'hi', extra: true }],
      temperature: 9,
    })
    expect(parsed).toEqual({ model: DEFAULT_MODEL, messages: [{ role: 'user', content: 'hi' }] })
  })
})
