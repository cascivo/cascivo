import { computed, signal } from '@cascivo/core'
import { persistedSignal, indexedDBDriver } from '@cascivo/storage'
import { parseSSE } from './lib/sse'
import { CHAT_ENDPOINT, DEFAULT_MODEL, LIMITS, isModelId } from './lib/protocol'
import type { ChatRequest, ChatTurn, ModelId, Role } from './lib/protocol'

export interface Message {
  id: string
  role: Role
  content: string
  /** The user stopped generation before the model finished. */
  stopped?: boolean
}

export interface Conversation {
  id: string
  title: string
  model: ModelId
  messages: Message[]
  updatedAt: number
}

// History lives in IndexedDB (unbounded, async); small UI preferences in localStorage.
export const conversations = persistedSignal<Conversation[]>('chat.conversations', [], {
  driver: indexedDBDriver('cascivo-chat'),
})
export const activeId = persistedSignal<string | null>('chat.active', null)
const storedModel = persistedSignal<string>('chat.model', DEFAULT_MODEL)

export const model = computed<ModelId>(() =>
  isModelId(storedModel.value) ? storedModel.value : DEFAULT_MODEL,
)
export function setModel(next: ModelId): void {
  storedModel.value = next
}

export const activeConversation = computed(
  () => conversations.value.find((c) => c.id === activeId.value) ?? null,
)

export const sortedConversations = computed(() =>
  [...conversations.value].sort((a, b) => b.updatedAt - a.updatedAt),
)

/** The conversation currently receiving tokens, if any. */
export const streamingId = signal<string | null>(null)
/** Text received so far for the in-flight reply. Never persisted token-by-token. */
export const draft = signal('')
export const error = signal<string | null>(null)

let controller: AbortController | null = null

const TITLE_CHARS = 48

function update(id: string, change: (c: Conversation) => Conversation): void {
  conversations.value = conversations.value.map((c) => (c.id === id ? change(c) : c))
}

function appendMessage(id: string, message: Message): void {
  update(id, (c) => ({ ...c, messages: [...c.messages, message], updatedAt: Date.now() }))
}

export function newChat(): void {
  activeId.value = null
  error.value = null
}

export function selectChat(id: string): void {
  activeId.value = id
  error.value = null
}

export function deleteChat(id: string): void {
  if (streamingId.value === id) stop()
  conversations.value = conversations.value.filter((c) => c.id !== id)
  if (activeId.value === id) activeId.value = null
}

export function stop(): void {
  controller?.abort()
}

/**
 * The most recent turns that fit the Worker's limits. Long conversations keep working; the
 * model simply stops seeing their oldest messages.
 */
export function contextWindow(messages: readonly Message[]): ChatTurn[] {
  const turns: ChatTurn[] = []
  let total = 0
  for (let i = messages.length - 1; i >= 0 && turns.length < LIMITS.maxMessages; i--) {
    const m = messages[i]
    if (!m || m.content.trim() === '') continue
    const content = m.content.slice(0, LIMITS.maxMessageChars)
    if (total + content.length > LIMITS.maxTotalChars) break
    total += content.length
    turns.unshift({ role: m.role, content })
  }
  // The model expects the window to open on a user turn.
  while (turns[0]?.role === 'assistant') turns.shift()
  return turns
}

export async function send(text: string): Promise<void> {
  const content = text.trim()
  if (!content || streamingId.value !== null) return

  let id = activeId.value
  if (!id || !conversations.value.some((c) => c.id === id)) {
    id = crypto.randomUUID()
    const conversation: Conversation = {
      id,
      title: content.length > TITLE_CHARS ? `${content.slice(0, TITLE_CHARS)}…` : content,
      model: model.value,
      messages: [],
      updatedAt: Date.now(),
    }
    conversations.value = [...conversations.value, conversation]
    activeId.value = id
  }
  appendMessage(id, { id: crypto.randomUUID(), role: 'user', content })
  await generate(id)
}

/** Re-runs the model for a conversation whose last reply failed. */
export async function retry(): Promise<void> {
  const conversation = activeConversation.value
  if (!conversation || streamingId.value !== null) return
  if (conversation.messages.at(-1)?.role !== 'user') return
  await generate(conversation.id)
}

async function generate(id: string): Promise<void> {
  const conversation = conversations.value.find((c) => c.id === id)
  if (!conversation) return

  const request: ChatRequest = {
    model: model.value,
    messages: contextWindow(conversation.messages),
  }
  const abort = new AbortController()
  controller = abort
  streamingId.value = id
  draft.value = ''
  error.value = null

  try {
    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
      signal: abort.signal,
    })
    if (!response.ok || !response.body) throw new Error(await failureMessage(response))

    for await (const event of parseSSE(response.body)) {
      if (event.event === 'token') draft.value += readField(event.data, 'text')
      else if (event.event === 'error') throw new Error(readField(event.data, 'message'))
      else if (event.event === 'done') break
    }
    commitDraft(id, false)
  } catch (cause) {
    if (abort.signal.aborted) commitDraft(id, true)
    else error.value = cause instanceof Error ? cause.message : String(cause)
  } finally {
    if (controller === abort) controller = null
    streamingId.value = null
    draft.value = ''
  }
}

function commitDraft(id: string, stopped: boolean): void {
  if (draft.value === '') return
  const message: Message = { id: crypto.randomUUID(), role: 'assistant', content: draft.value }
  if (stopped) message.stopped = true
  appendMessage(id, message)
}

/** Reads one string field from a JSON event payload the Worker produced. */
function readField(data: string, field: string): string {
  const parsed: unknown = JSON.parse(data)
  if (typeof parsed === 'object' && parsed !== null) {
    const value = (parsed as Record<string, unknown>)[field]
    if (typeof value === 'string') return value
  }
  throw new Error(`Malformed stream event: missing "${field}"`)
}

async function failureMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (typeof body === 'object' && body !== null) {
      const { error: message } = body as { error?: unknown }
      if (typeof message === 'string') return message
    }
  } catch {
    // Not JSON — fall through to the status line.
  }
  return `Request failed (${response.status})`
}
