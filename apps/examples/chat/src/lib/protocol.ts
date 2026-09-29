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

/** Events the Worker streams back, one SSE `event:` name each. */
export interface ChatStreamEvents {
  token: { text: string }
  done: Record<string, never>
  error: { message: string }
}

export const CHAT_ENDPOINT = '/api/chat'
