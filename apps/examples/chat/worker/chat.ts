import { parseSSE } from '@cascivo/data'
import { HttpError } from '@cascivo/app/api'
import { LIMITS } from '../src/lib/protocol'
import type { ChatRequest, ChatToken } from '../src/lib/protocol'

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

/**
 * Starts a reply. The model call happens before the stream does, so a quota, capacity or
 * model error is a real 502 — not an event inside a response that already said 200.
 */
export async function startChat(
  ai: AiBinding,
  body: ChatRequest,
): Promise<AsyncIterable<ChatToken>> {
  let upstream: ReadableStream<Uint8Array>
  try {
    upstream = await ai.run(body.model, {
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...body.messages],
      stream: true,
      max_tokens: LIMITS.maxOutputTokens,
    })
  } catch (error) {
    throw new HttpError(
      502,
      error instanceof Error ? error.message : 'The model could not be reached',
    )
  }
  return tokens(upstream)
}

/**
 * Re-encodes a Workers AI stream as this app's tokens. The client never sees a
 * model-specific payload, so swapping models (or providers) is a Worker-only change.
 */
async function* tokens(upstream: ReadableStream<Uint8Array>): AsyncGenerator<ChatToken> {
  for await (const { data } of parseSSE(upstream)) {
    if (data === '[DONE]') return
    const text = extractText(data)
    if (text) yield { text }
  }
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
