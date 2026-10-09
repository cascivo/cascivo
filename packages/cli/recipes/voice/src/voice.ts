import { signal } from '@cascivo/react'
import { VoiceClient } from 'agents/voice/client'
import type { TranscriptMessage, VoiceStatus } from 'agents/voice/client'

/**
 * The /voice page's connection to its agent (worker/voice.ts). `VoiceClient` does the audio:
 * the microphone, streaming it to the Worker, playing the replies, and noticing when you talk
 * over one. This file turns its events into signals, which the page reads.
 */

/** The Durable Object class; the client connects to /agents/voice/<conversation>. */
export const VOICE_AGENT = 'Voice'

/** One line of the conversation, from this call or an earlier one. */
export interface Line {
  role: 'user' | 'assistant'
  text: string
}

export const status = signal<VoiceStatus>('idle')
export const connected = signal(false)
/** The conversation as the agent stored it when this tab connected. */
export const history = signal<Line[]>([])
/** Turns since then; `transcript` from VoiceClient, minus what `history` already holds. */
export const transcript = signal<TranscriptMessage[]>([])
/** What the speech-to-text model has heard so far of the current sentence. */
export const interim = signal<string | null>(null)
/** Microphone level, 0–1. */
export const level = signal(0)
export const muted = signal(false)
export const error = signal<string | null>(null)

let client: VoiceClient | null = null
/** How much of VoiceClient's transcript the last history message already covered. */
let covered = 0

/**
 * Checks the history the agent sends on connect (worker/voice.ts). It crossed the network, so
 * anything that is not a list of { role, content } lines is ignored rather than trusted.
 */
export function parseHistory(raw: unknown): Line[] | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { type, messages } = raw as Record<string, unknown>
  if (type !== 'history' || !Array.isArray(messages)) return null
  const lines: Line[] = []
  for (const message of messages) {
    if (typeof message !== 'object' || message === null) continue
    const { role, content } = message as Record<string, unknown>
    if ((role === 'user' || role === 'assistant') && typeof content === 'string') {
      lines.push({ role, text: content })
    }
  }
  return lines
}

/** One conversation per tab: a reload keeps it, a new tab starts another. */
function conversationId(): string {
  const key = 'voice-conversation'
  try {
    const saved = sessionStorage.getItem(key)
    if (saved && /^[\w-]{1,64}$/.test(saved)) return saved
    const id = crypto.randomUUID()
    sessionStorage.setItem(key, id)
    return id
  } catch {
    return crypto.randomUUID()
  }
}

/** Connects once; later calls return the same client. */
export function voice(): VoiceClient {
  if (client) return client
  const c = new VoiceClient({ agent: VOICE_AGENT, name: conversationId() })
  c.addEventListener('statuschange', (value) => (status.value = value))
  c.addEventListener('connectionchange', (value) => (connected.value = value))
  c.addEventListener('transcriptchange', (value) => (transcript.value = value.slice(covered)))
  c.addEventListener('custommessage', (raw) => {
    const lines = parseHistory(raw)
    if (!lines) return
    history.value = lines
    covered = c.transcript.length
    transcript.value = []
  })
  c.addEventListener('interimtranscript', (value) => (interim.value = value))
  c.addEventListener('audiolevelchange', (value) => (level.value = value))
  c.addEventListener('mutechange', (value) => (muted.value = value))
  c.addEventListener('error', (value) => (error.value = value))
  c.connect()
  client = c
  return c
}
