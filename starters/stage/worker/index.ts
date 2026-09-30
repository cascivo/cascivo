import { createHandler, HttpError } from '@cascivo/app/api'
import { clientIp, guardResponse, rateLimit } from '@cascivo/app/guard'
import type { RateLimiter } from '@cascivo/app/guard'
import { roomResponse } from '@cascivo/app/sync-server'
import type { RoomNamespace } from '@cascivo/app/sync-server'
import { api } from '../src/api'
import { CODE_ALPHABET, CODE_LENGTH, parseCode, parseCreatedId } from '../src/model'
import { COMMAND_HEADER } from './stage-room'
import type { Command } from './stage-room'

export { StageRoom } from './stage-room'

export interface Env {
  /** One `StageRoom` Durable Object per session, named by its code. */
  STAGES: RoomNamespace<unknown>
  /** Starting a session is rate-limited per IP; see wrangler.jsonc. */
  CREATE_LIMIT: RateLimiter
}

function newCode(): string {
  return [...crypto.getRandomValues(new Uint8Array(CODE_LENGTH))]
    .map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length])
    .join('')
}

/** 32 random bytes, base64url: the host's only credential, shown once and kept in their browser. */
function newHostKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** The code in a path, or a 404 — the room is named after it, so it is checked before use. */
function codeOf(raw: string): string {
  try {
    return parseCode(raw)
  } catch {
    throw new HttpError(404, 'No session with this code')
  }
}

function hostKeyOf(request: Request): string {
  const match = /^Bearer (\S{32,256})$/.exec(request.headers.get('authorization') ?? '')
  if (!match) throw new HttpError(401, 'Host key missing')
  return match[1]!
}

/** Sends one command to the session's room and returns its JSON answer, or throws its error. */
export async function command(env: Env, code: string, body: Command): Promise<unknown> {
  const stub = env.STAGES.get(env.STAGES.idFromName(code))
  const response = await stub.fetch(
    new Request('https://stage.internal/command', {
      method: 'POST',
      headers: { [COMMAND_HEADER]: '1', 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )
  const data: unknown = await response.json()
  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'error' in data ? data.error : undefined
    throw new HttpError(
      response.status,
      typeof message === 'string' ? message : 'The session did not answer',
    )
  }
  return data
}

const ok = { ok: true } as const

const handle = createHandler<typeof api, Env>(api, {
  createSession: async ({ body, env, request }) => {
    await rateLimit(env.CREATE_LIMIT, clientIp(request))
    const hostKey = newHostKey()
    // A fresh code is taken about once in a billion tries at a few thousand live sessions;
    // a few retries make a collision a non-event rather than an error.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = newCode()
      try {
        await command(env, code, { op: 'create', title: body.title, hostKey })
        return { code, hostKey }
      } catch (error) {
        if (!(error instanceof HttpError && error.status === 409)) throw error
      }
    }
    throw new HttpError(503, 'Could not find a free code — try again')
  },
  checkHost: async ({ params, env, request }) => {
    await command(env, codeOf(params.code), { op: 'check', key: hostKeyOf(request) })
    return ok
  },
  ask: async ({ params, env, body }) => {
    return parseCreatedId(await command(env, codeOf(params.code), { op: 'ask', body }))
  },
  upvote: async ({ params, env, body }) => {
    await command(env, codeOf(params.code), { op: 'upvote', id: params.id, body })
    return ok
  },
  vote: async ({ params, env, body }) => {
    await command(env, codeOf(params.code), { op: 'vote', id: params.id, body })
    return ok
  },
  moderate: async ({ params, env, body, request }) => {
    const key = hostKeyOf(request)
    await command(env, codeOf(params.code), { op: 'moderate', key, id: params.id, body })
    return ok
  },
  createPoll: async ({ params, env, body, request }) => {
    const key = hostKeyOf(request)
    return parseCreatedId(await command(env, codeOf(params.code), { op: 'createPoll', key, body }))
  },
  setPoll: async ({ params, env, body, request }) => {
    const key = hostKeyOf(request)
    await command(env, codeOf(params.code), { op: 'setPoll', key, id: params.id, body })
    return ok
  },
  spotlight: async ({ params, env, body, request }) => {
    const key = hostKeyOf(request)
    await command(env, codeOf(params.code), { op: 'spotlight', key, body })
    return ok
  },
})

const ROOM = /^\/api\/sessions\/([^/]+)\/room$/

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const room = ROOM.exec(new URL(request.url).pathname)
    if (room) {
      try {
        // Read-only: the browser watches the session and shares presence (reactions), but
        // every stored change goes through the API above.
        return await roomResponse(request, env.STAGES, codeOf(room[1]!), { readOnly: true })
      } catch (error) {
        return guardResponse(error)
      }
    }
    return handle(request, env)
  },
}
