import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../worker/index'
import type { AiBinding } from '../worker/chat'
import { createMockAi } from '../worker/mock-ai'
import { LIMITS } from '../src/lib/protocol'
import * as store from '../src/store'

/**
 * Routes `fetch` straight into the Worker. Like a real fetch, aborting the request's signal
 * errors the response body mid-stream.
 */
function serve(ai: AiBinding): void {
  vi.stubGlobal('fetch', async (input: string, init: RequestInit = {}) => {
    const response = await worker.fetch(new Request(new URL(input, 'http://localhost'), init), {
      AI: ai,
    })
    if (!response.body || !init.signal) return response
    const body = response.body.pipeThrough(new TransformStream(), { signal: init.signal })
    return new Response(body, response)
  })
}

/** An AI binding that emits one token, then waits until the request is cancelled. */
function hangingAi(): AiBinding {
  return {
    async run() {
      let sent = false
      return new ReadableStream<Uint8Array>({
        pull(controller) {
          if (sent) return new Promise<void>(() => undefined)
          sent = true
          controller.enqueue(new TextEncoder().encode('data: {"response":"partial"}\n\n'))
        },
      })
    },
  }
}

async function until(check: () => boolean): Promise<void> {
  for (let i = 0; i < 100 && !check(); i++) await new Promise((r) => setTimeout(r, 0))
  expect(check()).toBe(true)
}

beforeEach(() => {
  store.conversations.value = []
  store.activeId.value = null
  store.error.value = null
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('chat store', () => {
  it('sends a message and commits the streamed reply', async () => {
    serve(createMockAi({ delayMs: 0 }))
    await store.send('Hello there')

    const conversation = store.activeConversation.value
    expect(conversation?.title).toBe('Hello there')
    expect(conversation?.messages.map((m) => m.role)).toEqual(['user', 'assistant'])
    expect(conversation?.messages[1]?.content).toContain('You said: "Hello there"')
    expect(store.streamingId.value).toBeNull()
    expect(store.draft.value).toBe('')
  })

  it('keeps the partial reply, marked stopped, when the user stops generation', async () => {
    serve(hangingAi())
    const pending = store.send('Tell me a long story')
    await until(() => store.draft.value === 'partial')

    store.stop()
    await pending

    const last = store.activeConversation.value?.messages.at(-1)
    expect(last).toMatchObject({ role: 'assistant', content: 'partial', stopped: true })
    expect(store.error.value).toBeNull()
  })

  it('surfaces a Worker error and lets the user retry', async () => {
    serve({ run: () => Promise.reject(new Error('Capacity exceeded')) })
    await store.send('Hi')
    expect(store.error.value).toBe('Capacity exceeded')
    expect(store.activeConversation.value?.messages).toHaveLength(1)

    serve(createMockAi({ delayMs: 0 }))
    await store.retry()
    expect(store.error.value).toBeNull()
    expect(store.activeConversation.value?.messages).toHaveLength(2)
  })

  it('ignores a send while a reply is streaming', async () => {
    serve(hangingAi())
    const pending = store.send('first')
    await until(() => store.streamingId.value !== null)
    await store.send('second')
    expect(store.activeConversation.value?.messages.map((m) => m.content)).toEqual(['first'])
    store.stop()
    await pending
  })

  it('deleting the streaming conversation stops it', async () => {
    serve(hangingAi())
    const pending = store.send('bye')
    await until(() => store.streamingId.value !== null)
    const id = store.activeId.value!
    store.deleteChat(id)
    await pending
    expect(store.conversations.value).toEqual([])
    expect(store.activeId.value).toBeNull()
  })
})

describe('contextWindow', () => {
  it('keeps the newest turns within the Worker limits and opens on a user turn', () => {
    const messages = Array.from({ length: LIMITS.maxMessages + 5 }, (_, i) => ({
      id: String(i),
      role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: `m${i}`,
    }))
    const window = store.contextWindow(messages)
    expect(window.length).toBeLessThanOrEqual(LIMITS.maxMessages)
    expect(window[0]?.role).toBe('user')
    expect(window.at(-1)?.content).toBe(`m${messages.length - 1}`)
  })

  it('drops the oldest turns once the character budget is spent', () => {
    const big = 'x'.repeat(LIMITS.maxMessageChars)
    const messages = Array.from({ length: 6 }, (_, i) => ({
      id: String(i),
      role: 'user' as const,
      content: big,
    }))
    const window = store.contextWindow(messages)
    const total = window.reduce((sum, t) => sum + t.content.length, 0)
    expect(total).toBeLessThanOrEqual(LIMITS.maxTotalChars)
    expect(window.length).toBe(LIMITS.maxTotalChars / LIMITS.maxMessageChars)
  })
})
