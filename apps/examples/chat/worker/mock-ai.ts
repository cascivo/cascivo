import type { AiBinding } from './chat'

/**
 * A stand-in for the Workers AI binding, used only by the Vite dev server so the app runs
 * without a Cloudflare account. It speaks the exact wire format of the real binding —
 * `data: {"response":"…"}` chunks, then `data: [DONE]` — so the Worker code path is the same.
 */
export function createMockAi(options: { delayMs?: number } = {}): AiBinding {
  const delayMs = options.delayMs ?? 30
  return {
    async run(model, input) {
      const last = input.messages.at(-1)?.content ?? ''
      const reply =
        `(mock ${model}) You said: "${last.slice(0, 200)}". ` +
        'Run `pnpm dev:worker` after `wrangler login` to talk to a real model on Workers AI.'
      const words = reply.split(/(?<= )/)
      const encoder = new TextEncoder()
      let i = 0
      return new ReadableStream<Uint8Array>({
        async pull(controller) {
          if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs))
          if (i < words.length) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ response: words[i++] })}\n\n`),
            )
          } else {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          }
        },
      })
    },
  }
}
