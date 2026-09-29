/**
 * The wire contract between the browser and the Worker. Both sides import this file, so a
 * change to the protocol is a type error on whichever side was not updated.
 */
export const MODELS = [
  { id: '@cf/meta/llama-3.1-8b-instruct', label: 'Llama 3.1 8B' },
  { id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', label: 'Llama 3.3 70B' },
] as const

export type ModelId = (typeof MODELS)[number]['id']

export const DEFAULT_MODEL: ModelId = MODELS[0].id

export function isModelId(value: unknown): value is ModelId {
  return MODELS.some((m) => m.id === value)
}

export type Role = 'user' | 'assistant'

export interface ChatTurn {
  role: Role
  content: string
}

export interface ChatRequest {
  model: ModelId
  messages: ChatTurn[]
}

/** Bounds the Worker enforces on every request — the client has no say in them. */
export const LIMITS = {
  maxMessages: 40,
  maxMessageChars: 8_000,
  maxTotalChars: 32_000,
  maxOutputTokens: 1_024,
} as const

/** One streamed piece of the reply. */
export interface ChatToken {
  text: string
}

/**
 * Parses an untrusted request body into a `ChatRequest`, or throws with a message the
 * Worker returns as a 400. Runs on the server, inside `createHandler`.
 */
export function parseChatRequest(raw: unknown): ChatRequest {
  if (typeof raw !== 'object' || raw === null) throw new Error('Body must be a JSON object')
  const { model, messages } = raw as { model?: unknown; messages?: unknown }
  if (!isModelId(model)) throw new Error('Unknown model')
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('messages must be a non-empty array')
  }
  if (messages.length > LIMITS.maxMessages) throw new Error('Too many messages')

  let total = 0
  const turns: ChatTurn[] = messages.map((m: unknown, i) => {
    if (typeof m !== 'object' || m === null) throw new Error(`messages[${i}] is not an object`)
    const { role, content } = m as { role?: unknown; content?: unknown }
    if (role !== 'user' && role !== 'assistant') {
      throw new Error(`messages[${i}].role must be "user" or "assistant"`)
    }
    if (typeof content !== 'string' || content.trim() === '') {
      throw new Error(`messages[${i}].content must be a non-empty string`)
    }
    if (content.length > LIMITS.maxMessageChars) throw new Error(`messages[${i}] is too long`)
    total += content.length
    return { role, content }
  })
  if (total > LIMITS.maxTotalChars) throw new Error('Conversation is too long')
  if (turns.at(-1)?.role !== 'user') throw new Error('The last message must be from the user')
  return { model, messages: turns }
}

/** Parses one streamed event. Runs in the browser, inside the typed client. */
export function parseToken(raw: unknown): ChatToken {
  if (typeof raw === 'object' && raw !== null) {
    const { text } = raw as { text?: unknown }
    if (typeof text === 'string') return { text }
  }
  throw new Error('Malformed token event')
}
