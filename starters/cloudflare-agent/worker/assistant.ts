import { AIChatAgent } from '@cloudflare/ai-chat'
import { convertToModelMessages, stepCountIs, streamText, tool } from 'ai'
import type { LanguageModel } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'
import { z } from 'zod'
import { checkView } from '../src/assistant'
import type { Env } from './index'
import { scriptedModel } from './scripted-model'

/** Any Workers AI model with tool calling. */
const MODEL = '@cf/moonshotai/kimi-k2.7-code'

const SYSTEM = `You are an assistant inside a web app. When an answer is best shown as UI — a
summary, a status overview, a list — call show_view instead of describing it in text.
A view is { "view": { "regions": { "main": [nodes] } } }.
A node is { "component": Name, "props": { ... }, "children": [nodes] or "text" }.
Components: Flex (direction: "vertical" | "horizontal", gap: 1-8, wrap), Grid (cols: 1-4, gap),
Card (padding: "sm" | "md" | "lg"; content as children), Badge (variant: "default" | "success" |
"warning" | "destructive"; text as children), Alert (variant: "info" | "success" | "warning" |
"destructive", title; text as children), ProgressBar (value, max, label), Separator,
EmptyState (title, description).
If show_view returns errors, fix exactly those and call it again. Keep text replies short.`

const showView = tool({
  description: 'Show the user a view built from cascivo components. Returns errors to fix, or ok.',
  inputSchema: z.object({
    title: z.string().describe('A short title for the view'),
    view: z.object({ view: z.object({ regions: z.record(z.string(), z.array(z.unknown())) }) }),
  }),
  execute: async ({ title, view }) => checkView(title, view),
})

/**
 * One Durable Object per conversation: it stores the messages in its SQLite database and
 * streams replies to every open tab over a WebSocket, resuming a stream after a reconnect.
 */
export class Assistant extends AIChatAgent<Env> {
  async onChatMessage(_onFinish: unknown, options?: { abortSignal?: AbortSignal }) {
    // `vite dev` answers from a scripted model, so the page works offline and without an
    // account. A deployed Worker calls Workers AI, and so does `VITE_REAL_AI=1 vite dev`.
    const scripted = import.meta.env.DEV && import.meta.env['VITE_REAL_AI'] !== '1'
    const model: LanguageModel = scripted
      ? scriptedModel()
      : createWorkersAI({ binding: this.env.AI })(MODEL)
    const result = streamText({
      model,
      system: SYSTEM,
      messages: await convertToModelMessages(this.messages),
      tools: { show_view: showView },
      stopWhen: stepCountIs(4),
      ...(options?.abortSignal ? { abortSignal: options.abortSignal } : {}),
    })
    return result.toUIMessageStreamResponse()
  }
}
