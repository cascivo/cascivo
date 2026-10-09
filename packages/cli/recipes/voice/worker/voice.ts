import { Agent } from 'agents'
import type { Connection } from 'agents'
import { withVoice, WorkersAIFluxSTT, WorkersAITTS } from 'agents/voice'
import type { TextSource, VoiceTurnContext } from 'agents/voice'
import type { Env } from './index'
import { scriptedReply, ScriptedTranscriber, silentSpeech } from './scripted-voice'

/** Any Workers AI text model; replies stream into speech sentence by sentence. */
const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'

/** How many earlier messages a reload shows. */
const HISTORY_SHOWN = 50

const SYSTEM = `You are a voice assistant inside a web app. Your replies are spoken aloud, so
answer in one to three short sentences of plain speech: no lists, no markdown, no emoji.`

// `vite dev` has no Workers AI, so there the voice is a stand-in (worker/scripted-voice.ts):
// it "hears" a fixed question every few seconds of audio and answers without sound. A
// deployed Worker uses Workers AI for all three steps, and so does `VITE_REAL_AI=1 vite dev`.
const scripted = import.meta.env.DEV && import.meta.env['VITE_REAL_AI'] !== '1'

const VoiceAgent = withVoice(Agent<Env>)

/**
 * One Durable Object per conversation: speech in, text through a model, speech out. It keeps
 * the conversation in its SQLite database, so a reconnect carries on where it was.
 */
export class Voice extends VoiceAgent {
  transcriber = scripted ? new ScriptedTranscriber() : new WorkersAIFluxSTT(this.env.AI)
  tts = scripted ? silentSpeech : new WorkersAITTS(this.env.AI)

  /** VoiceClient starts empty: send a new connection the conversation so far (src/voice.ts). */
  onConnect(connection: Connection): void {
    connection.send(
      JSON.stringify({ type: 'history', messages: this.getConversationHistory(HISTORY_SHOWN) }),
    )
  }

  async onTurn(transcript: string, { messages, signal }: VoiceTurnContext): Promise<TextSource> {
    if (scripted) return scriptedReply(transcript)
    try {
      // A stream of server-sent events; the voice pipeline reads the text out of it.
      const stream = await this.env.AI.run(
        MODEL,
        {
          messages: [
            { role: 'system', content: SYSTEM },
            ...messages,
            { role: 'user', content: transcript },
          ],
          stream: true,
        },
        { signal },
      )
      if (!(stream instanceof ReadableStream)) throw new Error('Workers AI returned no stream')
      return stream
    } catch (error) {
      if (signal.aborted) throw error
      // Said aloud rather than left as silence; the cause is in the Worker's logs.
      console.error('[voice] the model call failed:', error)
      return 'Sorry, I could not reach the model just now.'
    }
  }
}
