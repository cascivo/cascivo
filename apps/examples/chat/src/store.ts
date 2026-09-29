import { buildPath } from '@cascivo/app'
import { createClient } from '@cascivo/app/api'
import { computed, signal } from '@cascivo/core'
import { persistedSignal, indexedDBDriver } from '@cascivo/storage'
import { api } from './api'
import { DEFAULT_MODEL, LIMITS, isModelId } from './lib/protocol'
import type { ChatRequest, ChatTurn, ModelId, Role } from './lib/protocol'
import { router } from './router'

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

const client = createClient(api)

// History lives in IndexedDB (unbounded, async); small UI preferences in localStorage.
export const conversations = persistedSignal<Conversation[]>('chat.conversations', [], {
  driver: indexedDBDriver('cascivo-chat'),
})
// The open conversation is the URL (`/c/:id`), not stored state: a link, a reload and the
// back button all agree on it.
export const activeId = computed(() => router.match.value?.params['id'] ?? null)
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
/** The last failed reply, scoped to its conversation so it does not follow you around. */
export const error = signal<{ conversationId: string; message: string } | null>(null)

let controller: AbortController | null = null

const TITLE_CHARS = 48

function update(id: string, change: (c: Conversation) => Conversation): void {
  conversations.value = conversations.value.map((c) => (c.id === id ? change(c) : c))
}

function appendMessage(id: string, message: Message): void {
  update(id, (c) => ({ ...c, messages: [...c.messages, message], updatedAt: Date.now() }))
}

/** The URL of a conversation. Typed: the pattern's params are checked at compile time. */
export function chatPath(id: string): string {
  return buildPath('/c/:id', { id })
}

export function newChat(): void {
  router.navigate('/')
}

export function deleteChat(id: string): void {
  if (streamingId.value === id) stop()
  conversations.value = conversations.value.filter((c) => c.id !== id)
  if (error.value?.conversationId === id) error.value = null
  if (activeId.value === id) router.navigate('/', { replace: true })
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
    // Replace, not push: `/` was this conversation's draft, so Back should not return to it.
    router.navigate(chatPath(id), { replace: true })
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
  if (error.value?.conversationId === id) error.value = null

  try {
    for await (const token of client.chat({ body: request, signal: abort.signal })) {
      draft.value += token.text
    }
    commitDraft(id, false)
  } catch (cause) {
    if (abort.signal.aborted) commitDraft(id, true)
    else {
      error.value = {
        conversationId: id,
        message: cause instanceof Error ? cause.message : String(cause),
      }
    }
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
