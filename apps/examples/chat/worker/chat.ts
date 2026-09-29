import { parseSSE, formatSSE } from '../src/lib/sse'
import { LIMITS, isModelId } from '../src/lib/protocol'
import type { ChatRequest, ChatStreamEvents, ChatTurn } from '../src/lib/protocol'

/**
 * The slice of the Workers AI binding this app uses. Declared locally rather than pulling in
 * `@cloudflare/workers-types`: with `stream: true`, `run` resolves to an SSE byte stream of
 * `data: {"response":"…"}` lines ending in `data: [DONE]`.
 */
export interface AiBinding {
  run(
    model: string,
    input: {
      messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
      stream: true
      max_tokens: number
    },
  ): Promise<ReadableStream<Uint8Array>>
}

const SYSTEM_PROMPT =
  'You are a concise, friendly assistant inside a demo app built with cascivo. ' +
  'Answer in plain text or light Markdown.'

export class BadRequest extends Error {}

/** Parses an untrusted request body into a `ChatRequest`, or throws `BadRequest`. */
export function parseChatRequest(raw: unknown): ChatRequest {
  if (typeof raw !== 'object' || raw === null) throw new BadRequest('Body must be a JSON object')
  const { model, messages } = raw as { model?: unknown; messages?: unknown }
  if (!isModelId(model)) throw new BadRequest('Unknown model')
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new BadRequest('messages must be a non-empty array')
  }
  if (messages.length > LIMITS.maxMessages) throw new BadRequest('Too many messages')

  let total = 0
  const turns: ChatTurn[] = messages.map((m: unknown, i) => {
    if (typeof m !== 'object' || m === null) throw new BadRequest(`messages[${i}] is not an object`)
    const { role, content } = m as { role?: unknown; content?: unknown }
    if (role !== 'user' && role !== 'assistant') {
      throw new BadRequest(`messages[${i}].role must be "user" or "assistant"`)
    }
    if (typeof content !== 'string' || content.trim() === '') {
      throw new BadRequest(`messages[${i}].content must be a non-empty string`)
    }
    if (content.length > LIMITS.maxMessageChars) {
      throw new BadRequest(`messages[${i}] is too long`)
    }
    total += content.length
    return { role, content }
  })
  if (total > LIMITS.maxTotalChars) throw new BadRequest('Conversation is too long')
  if (turns.at(-1)?.role !== 'user') throw new BadRequest('The last message must be from the user')
  return { model, messages: turns }
}

function send<E extends keyof ChatStreamEvents>(event: E, data: ChatStreamEvents[E]): string {
  return formatSSE(event, data)
}

/**
 * Re-encodes a Workers AI stream into this app's protocol. The client never sees a
 * model-specific payload, so swapping models (or providers) is a Worker-only change.
 */
export function toChatStream(upstream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const events = parseSSE(upstream)
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const next = await events.next()
        if (next.done || next.value.data === '[DONE]') {
          controller.enqueue(encoder.encode(send('done', {})))
          controller.close()
          await events.return()
          return
        }
        const text = extractText(next.value.data)
        if (text) controller.enqueue(encoder.encode(send('token', { text })))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Stream failed'
        controller.enqueue(encoder.encode(send('error', { message })))
        controller.close()
      }
    },
    async cancel() {
      await events.return()
    },
  })
}

function extractText(data: string): string {
  try {
    const parsed: unknown = JSON.parse(data)
    if (typeof parsed === 'object' && parsed !== null) {
      const { response } = parsed as { response?: unknown }
      if (typeof response === 'string') return response
    }
  } catch {
    // A non-JSON line from upstream carries no text; skipping it keeps the stream alive.
  }
  return ''
}

export async function handleChat(request: Request, ai: AiBinding): Promise<Response> {
  let body: ChatRequest
  try {
    body = parseChatRequest(await request.json())
  } catch (error) {
    const message = error instanceof BadRequest ? error.message : 'Body must be valid JSON'
    return Response.json({ error: message }, { status: 400 })
  }

  let upstream: ReadableStream<Uint8Array>
  try {
    upstream = await ai.run(body.model, {
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...body.messages],
      stream: true,
      max_tokens: LIMITS.maxOutputTokens,
    })
  } catch (error) {
    // Quota, capacity and model errors surface here, before any byte is streamed.
    const message = error instanceof Error ? error.message : 'The model could not be reached'
    return Response.json({ error: message }, { status: 502 })
  }

  return new Response(toChatStream(upstream), {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
    },
  })
}
