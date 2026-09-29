import { CHAT_ENDPOINT } from '../src/lib/protocol'
import { handleChat } from './chat'
import type { AiBinding } from './chat'

export interface Env {
  AI: AiBinding
  /** Static assets (the built SPA). `wrangler.jsonc` routes only `/api/*` to this Worker. */
  ASSETS?: { fetch(request: Request): Promise<Response> }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)

    if (pathname === CHAT_ENDPOINT) {
      if (request.method !== 'POST') {
        return new Response(null, { status: 405, headers: { allow: 'POST' } })
      }
      return handleChat(request, env.AI)
    }

    if (pathname.startsWith('/api/')) {
      return Response.json({ error: `No route for ${pathname}` }, { status: 404 })
    }

    if (env.ASSETS) return env.ASSETS.fetch(request)
    return new Response('Not found', { status: 404 })
  },
}
