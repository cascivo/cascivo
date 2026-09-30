import { describe, expect, it } from 'vitest'
import { formatSSE, parseSSE } from './sse'
import type { ServerSentEvent } from './sse'

function streamOf(...chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<ServerSentEvent[]> {
  const events: ServerSentEvent[] = []
  for await (const event of parseSSE(stream)) events.push(event)
  return events
}

describe('parseSSE', () => {
  it('parses named and default events', async () => {
    const events = await collect(streamOf('event: token\ndata: {"a":1}\n\ndata: plain\n\n'))
    expect(events).toEqual([
      { event: 'token', data: '{"a":1}', id: '' },
      { event: 'message', data: 'plain', id: '' },
    ])
  })

  it('reassembles events split at arbitrary chunk boundaries', async () => {
    const wire = 'event: a\ndata: hello\n\nevent: b\ndata: world\n\n'
    const chunks = wire.split('')
    const events = await collect(streamOf(...chunks))
    expect(events.map((e) => [e.event, e.data])).toEqual([
      ['a', 'hello'],
      ['b', 'world'],
    ])
  })

  it('accepts CRLF, CR and LF line endings, including CRLF split across chunks', async () => {
    const events = await collect(streamOf('data: one\r', '\n\r', '\ndata: two\r\rdata: three\n\n'))
    expect(events.map((e) => e.data)).toEqual(['one', 'two', 'three'])
  })

  it('joins multi-line data with newlines', async () => {
    const events = await collect(streamOf('data: first\ndata: second\ndata\n\n'))
    expect(events[0]?.data).toBe('first\nsecond\n')
  })

  it('ignores comments and unknown fields, strips only one leading space', async () => {
    const events = await collect(streamOf(': keep-alive\nfoo: bar\ndata:  two spaces\n\n'))
    expect(events).toEqual([{ event: 'message', data: ' two spaces', id: '' }])
  })

  it('carries the last event id forward and reads a numeric retry', async () => {
    const events = await collect(
      streamOf('id: 7\nretry: 1500\ndata: a\n\ndata: b\n\nretry: x\ndata: c\n\n'),
    )
    expect(events).toEqual([
      { event: 'message', data: 'a', id: '7', retry: 1500 },
      { event: 'message', data: 'b', id: '7' },
      { event: 'message', data: 'c', id: '7' },
    ])
  })

  it('does not dispatch an event that has no data', async () => {
    const events = await collect(streamOf('event: ping\n\ndata: real\n\n'))
    expect(events).toEqual([{ event: 'message', data: 'real', id: '' }])
  })

  it('strips a leading BOM and discards an unterminated final event', async () => {
    const events = await collect(streamOf('﻿data: ok\n\ndata: cut off'))
    expect(events.map((e) => e.data)).toEqual(['ok'])
  })

  it('cancels the upstream when the consumer stops early', async () => {
    let cancelled = false
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new TextEncoder().encode('data: tick\n\n'))
      },
      cancel() {
        cancelled = true
      },
    })
    for await (const event of parseSSE(stream)) {
      expect(event.data).toBe('tick')
      break
    }
    expect(cancelled).toBe(true)
  })

  it('round-trips formatSSE', async () => {
    const events = await collect(streamOf(formatSSE('token', { text: 'a\nb' })))
    expect(events).toEqual([{ event: 'token', data: '{"text":"a\\nb"}', id: '' }])
  })
})
