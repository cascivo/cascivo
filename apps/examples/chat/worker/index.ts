import { createHandler } from '@cascivo/app/api'
import { api } from '../src/api'
import { startChat } from './chat'
import type { AiBinding } from './chat'

export interface Env {
  AI: AiBinding
  /** Static assets (the built SPA). `wrangler.jsonc` routes only `/api/*` to this Worker. */
  ASSETS?: { fetch(request: Request): Promise<Response> }
}

// Every endpoint in `api` must have a handler here, typed from the contract: `body` is the
// already-parsed `ChatRequest`, and the stream must yield `ChatToken`s.
const handleApi = createHandler<typeof api, Env>(api, {
  chat: ({ body, env }) => startChat(env.AI, body),
})

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)
    if (pathname.startsWith('/api/')) return handleApi(request, env)
    if (env.ASSETS) return env.ASSETS.fetch(request)
    return new Response('Not found', { status: 404 })
  },
}
