import type {
  TTSProvider,
  Transcriber,
  TranscriberSession,
  TranscriberSessionOptions,
} from 'agents/voice'

/**
 * `vite dev` stand-ins for Workers AI's speech models, which have no local mode. They keep the
 * whole call working offline — microphone, streaming, turns, transcript — without a model:
 * the transcriber "hears" a fixed question for every few seconds of sound, and the replies
 * are text only. Production never uses them (see worker/voice.ts).
 */

/** 16 kHz, 16-bit mono: this many bytes is three seconds of audio. */
const BYTES_PER_TURN = 16_000 * 2 * 3
const QUESTIONS = ['What can you do?', 'How do I deploy this app?', 'Thanks, that is all.']

export class ScriptedTranscriber implements Transcriber {
  createSession(options: TranscriberSessionOptions = {}): TranscriberSession {
    let bytes = 0
    let turn = 0
    return {
      feed(chunk) {
        bytes += chunk.byteLength
        if (bytes < BYTES_PER_TURN) return
        bytes = 0
        options.onUtterance?.(QUESTIONS[turn++ % QUESTIONS.length]!)
      },
      close() {},
    }
  }
}

/** No sound in `vite dev`: the reply shows in the transcript only. */
export const silentSpeech: TTSProvider = { synthesize: async () => null }

const REPLIES: Record<string, string> = {
  'What can you do?':
    'I am the development stand-in. Deploy, or set VITE_REAL_AI=1, for Workers AI.',
  'How do I deploy this app?': 'Run the deploy script. It builds the page and the Worker together.',
}

export function scriptedReply(transcript: string): string {
  return REPLIES[transcript] ?? `You said: ${transcript}`
}
