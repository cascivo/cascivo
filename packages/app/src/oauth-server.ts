import { HttpError } from '@cascivo/data'
import {
  checkOrigin,
  currentUser,
  hostCookie,
  migrateAccounts,
  parseUser,
  readCookie,
  sessionRoutes,
  startSession,
} from './accounts'
import { queryRows } from './db'
import type { Database } from './db'
import {
  beginAuthorization,
  completeAuthorization,
  OAuthError,
  parsePendingAuthorization,
  seal,
  unseal,
} from './oauth'
import type { Identity, OAuthErrorCode, OAuthProvider, PendingAuthorization } from './oauth'

/**
 * `@cascivo/app/oauth-server` — "Sign in with GitHub / Google" for the Worker, on the same
 * users and sessions as `handleAuth` (`@cascivo/app/auth-server`), so the two compose on one
 * sign-in page and `requireUser` works for both.
 *
 * ```ts
 * const oauth = handleOAuth(env.DB, {
 *   secret: env.AUTH_SECRET,
 *   providers: [github({ clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET })],
 * })
 * const answered = await oauth(request) // /api/auth/oauth/<provider>, …/callback, /me, /signout
 * if (answered) return answered
 * ```
 */

export interface OAuthServerOptions {
  /** The providers offered, each answered at `<base>/oauth/<provider.id>`. */
  providers: readonly OAuthProvider[]
  /**
   * Seals the flow's state in a cookie between the redirect and the callback: a Worker secret
   * of at least 32 characters (`openssl rand -base64 32`).
   */
  secret: string
  /** Where the handler answers. Default `/api/auth`, the same as `handleAuth`. */
  basePath?: string
  /**
   * The app's public origin, used for the redirect URI registered with each provider:
   * `<origin><base>/oauth/<id>/callback`. Default: the request's. Set it when the Worker is
   * reachable at more than one host (`*.workers.dev` and a custom domain), so the redirect
   * always matches the one registered.
   */
  origin?: string
  /**
   * The app page a failed sign-in returns to, with `?error=<code>` (`denied`, `expired`,
   * `state_mismatch`, `provider_error`, `identity_in_use`). Default `/signin`.
   */
  errorPath?: string
  /** Default 30 days. */
  sessionTtlSeconds?: number
}

/** Why a sign-in failed, as `?error=` on `errorPath`. */
export type OAuthFailure = OAuthErrorCode | 'identity_in_use'

const PENDING_COOKIE = '__Host-oauth'
const PENDING_CONTEXT = 'cascivo-oauth-pending'
const PENDING_TTL = 10 * 60

interface Pending {
  authorization: PendingAuthorization
  returnTo: string
}

function parsePending(raw: unknown): Pending | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { authorization, returnTo } = raw as Record<string, unknown>
  if (typeof returnTo !== 'string') return null
  try {
    return { authorization: parsePendingAuthorization(authorization), returnTo }
  } catch {
    return null
  }
}

/**
 * A path on this site, or `/`. Resolved against the origin, `//evil.example`, `/\evil.example`
 * and absolute URLs land on another origin, and are refused.
 */
function safeReturnTo(raw: string | null, origin: string): string {
  if (!raw) return '/'
  let url: URL
  try {
    url = new URL(raw, origin)
  } catch {
    return '/'
  }
  return url.origin === origin ? `${url.pathname}${url.search}${url.hash}` : '/'
}

function redirect(location: string, cookies: string[]): Response {
  const headers = new Headers({ location })
  for (const cookie of cookies) headers.append('set-cookie', cookie)
  return new Response(null, { status: 302, headers })
}

const ID = /^[a-z][a-z0-9-]{0,31}$/

/**
 * Answers `GET <base>/oauth` (the provider ids, for a sign-in page), `GET <base>/oauth/<id>`
 * (redirects to the provider; `?returnTo=/path` is where to land after), `GET
 * <base>/oauth/<id>/callback`, and `GET <base>/me` / `POST <base>/signout`; returns `null` for
 * any other request.
 *
 * On the callback, the user is found by the identity `(provider, subject)`. A new identity
 * joins the signed-in user when there is one (linking from a settings page), else the user
 * with the same **verified** email, else a new user, whose email may be `null`. An identity
 * already linked to someone else is refused while another user is signed in.
 */
export function handleOAuth(
  db: Database,
  options: OAuthServerOptions,
): (request: Request) => Promise<Response | null> {
  const base = options.basePath ?? '/api/auth'
  const errorPath = options.errorPath ?? '/signin'
  const sessionTtl = options.sessionTtlSeconds ?? 30 * 24 * 60 * 60
  const providers = new Map<string, OAuthProvider>()
  for (const provider of options.providers) {
    if (!ID.test(provider.id)) throw new Error(`Provider id "${provider.id}" is not a URL segment`)
    if (providers.has(provider.id)) throw new Error(`Provider "${provider.id}" is listed twice`)
    providers.set(provider.id, provider)
  }
  const shared = sessionRoutes(db)

  const fail = (code: OAuthFailure, origin: string): Response => {
    const url = new URL(errorPath, origin)
    url.searchParams.set('error', code)
    return redirect(url.href, [hostCookie(PENDING_COOKIE, '', 0)])
  }

  async function userFor(identity: Identity, request: Request): Promise<string | null> {
    const signedIn = await currentUser(db, request)
    const linked = await identityOwner(identity)
    if (linked) return signedIn && signedIn.id !== linked ? null : linked
    let userId = signedIn?.id
    if (!userId && identity.email) {
      // Only an email the provider verified gets here (`Identity.email`), so an account that
      // proved the same address by a sign-in link is the same person.
      await db
        .prepare(
          'INSERT INTO users (id, email, created_at) VALUES (?, ?, ?) ON CONFLICT (email) DO NOTHING',
        )
        .bind(crypto.randomUUID(), identity.email, new Date().toISOString())
        .run()
      const [user] = await queryRows(
        db,
        'SELECT id, email FROM users WHERE email = ?',
        [identity.email],
        parseUser,
      )
      userId = user?.id
    }
    if (!userId) {
      userId = crypto.randomUUID()
      await db
        .prepare('INSERT INTO users (id, email, created_at) VALUES (?, NULL, ?)')
        .bind(userId, new Date().toISOString())
        .run()
    }
    await db
      .prepare(
        `INSERT INTO user_identities (provider, subject, user_id, created_at) VALUES (?, ?, ?, ?)
         ON CONFLICT (provider, subject) DO NOTHING`,
      )
      .bind(identity.provider, identity.subject, userId, new Date().toISOString())
      .run()
    // Two callbacks racing for one new identity: whichever row landed is the answer.
    const owner = await identityOwner(identity)
    if (!owner) throw new Error('The identity was not stored')
    return signedIn && signedIn.id !== owner ? null : owner
  }

  async function identityOwner(identity: Identity): Promise<string | null> {
    const [row] = await queryRows(
      db,
      'SELECT user_id FROM user_identities WHERE provider = ? AND subject = ?',
      [identity.provider, identity.subject],
      (raw) => {
        const userId =
          typeof raw === 'object' && raw !== null
            ? (raw as Record<string, unknown>)['user_id']
            : undefined
        if (typeof userId !== 'string') throw new Error('Malformed identity row')
        return userId
      },
    )
    return row ?? null
  }

  async function start(provider: OAuthProvider, request: Request, origin: string) {
    const returnTo = safeReturnTo(new URL(request.url).searchParams.get('returnTo'), origin)
    const { url, pending } = await beginAuthorization(provider, {
      redirectUri: `${origin}${base}/oauth/${provider.id}/callback`,
      ttlSeconds: PENDING_TTL,
    })
    const sealed = await seal(options.secret, PENDING_CONTEXT, {
      authorization: pending,
      returnTo,
    } satisfies Pending)
    return redirect(url, [hostCookie(PENDING_COOKIE, sealed, PENDING_TTL)])
  }

  async function callback(provider: OAuthProvider, request: Request, origin: string) {
    const cookie = readCookie(request, PENDING_COOKIE)
    // No cookie: it expired, or the callback was opened in another browser than the start.
    if (!cookie) return fail('expired', origin)
    const pending = parsePending(await unseal(options.secret, PENDING_CONTEXT, cookie))
    if (!pending) return fail('state_mismatch', origin)
    let identity: Identity
    try {
      const completed = await completeAuthorization(
        provider,
        pending.authorization,
        new URL(request.url).searchParams,
      )
      identity = completed.identity
    } catch (error) {
      if (error instanceof OAuthError) {
        console.warn(`[cascivo/oauth] ${provider.id}: ${error.code}: ${error.message}`)
        return fail(error.code, origin)
      }
      throw error
    }
    await migrateAccounts(db)
    const userId = await userFor(identity, request)
    if (!userId) return fail('identity_in_use', origin)
    return redirect(new URL(pending.returnTo, origin).href, [
      hostCookie(PENDING_COOKIE, '', 0),
      await startSession(db, userId, sessionTtl),
    ])
  }

  return async (request) => {
    const url = new URL(request.url)
    if (!url.pathname.startsWith(`${base}/`)) return null
    const rest = url.pathname.slice(base.length + 1)
    const sharedRoute = shared[`${request.method} ${rest}`]
    if (sharedRoute) {
      try {
        checkOrigin(request)
        await migrateAccounts(db)
        return await sharedRoute(request)
      } catch (error) {
        if (error instanceof HttpError) {
          return Response.json({ error: error.message }, { status: error.status })
        }
        throw error
      }
    }
    if (request.method !== 'GET') return null
    if (rest === 'oauth') return Response.json({ providers: [...providers.keys()] })
    const match = /^oauth\/([^/]+)(\/callback)?$/.exec(rest)
    const provider = match ? providers.get(match[1]!) : undefined
    if (!match || !provider) return null
    if (options.secret.length < 32) {
      return Response.json(
        { error: 'Sign-in is not configured: set a secret of at least 32 characters' },
        { status: 500 },
      )
    }
    const origin = options.origin ? new URL(options.origin).origin : url.origin
    return match[2] ? callback(provider, request, origin) : start(provider, request, origin)
  }
}
