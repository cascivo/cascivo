import { HttpError } from '@cascivo/data'
import { migrate, queryRows } from './db'
import type { Database } from './db'

/**
 * `@cascivo/app/auth-server` — accounts with passwordless sign-in, for the Worker.
 *
 * Someone enters an email; `sendLink` emails them a one-time link; opening it signs them in
 * with a session cookie. Users, links and sessions live in D1 (any `Database`), and only
 * SHA-256 hashes of links and session ids are stored, so a leaked table signs no one in.
 *
 * ```ts
 * const auth = handleAuth(env.DB, { sendLink: (email, url) => env.EMAIL.send({ … }) })
 * const answered = await auth(request)   // /api/auth/start, /verify, /me, /signout
 * if (answered) return answered
 * const user = await requireUser(env.DB, request) // 401 unless signed in
 * ```
 */

export interface User {
  id: string
  email: string
}

export interface AuthOptions {
  /** Emails the sign-in link. The link is a secret: send it to `email` and nowhere else. */
  sendLink(email: string, url: string): Promise<void>
  /**
   * The app page the link opens, which posts the token to `/verify`. A page rather than the
   * API, so a mail scanner that fetches every link cannot use one up. Default `/signin/verify`.
   */
  verifyPath?: string
  /** Where the handler answers. Default `/api/auth`. */
  basePath?: string
  /** Default 15 minutes. */
  linkTtlSeconds?: number
  /** Default 30 days. */
  sessionTtlSeconds?: number
  /**
   * Also returns the link in the `/start` response, so `vite dev` can sign in without email.
   * Pass `import.meta.env.DEV`; never `true` in production, where it would let anyone sign in
   * as anyone.
   */
  exposeLink?: boolean
}

export const SESSION_COOKIE = '__Host-session'

const migrations = [
  {
    id: 'cascivo_auth_0001',
    statements: [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS auth_links (
        hash TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS sessions (
        hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users (id),
        expires_at INTEGER NOT NULL
      )`,
    ],
  },
]

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Trims and lowercases an address, or throws `HttpError(400)` for one that is not. */
export function normalizeEmail(raw: unknown): string {
  const email = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (email.length > 254 || !EMAIL.test(email)) throw new HttpError(400, 'Enter a valid email')
  return email
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

const now = () => Math.floor(Date.now() / 1000)

function readCookie(request: Request, name: string): string | null {
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return rest.join('=')
  }
  return null
}

function sessionCookie(value: string, maxAge: number): string {
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
}

/**
 * Refuses a state-changing request from another site (a form posted from elsewhere carries
 * this app's cookie only under SameSite=Lax's exceptions, and never a matching Origin).
 */
function checkOrigin(request: Request): void {
  if (request.method === 'GET' || request.method === 'HEAD') return
  const origin = request.headers.get('origin')
  if (origin !== null && origin !== new URL(request.url).origin) {
    throw new HttpError(403, 'Cross-site request refused')
  }
}

function parseUser(raw: unknown): User {
  if (typeof raw === 'object' && raw !== null) {
    const { id, email } = raw as Record<string, unknown>
    if (typeof id === 'string' && typeof email === 'string') return { id, email }
  }
  throw new Error('Malformed user row')
}

function parseLinkEmail(raw: unknown): string {
  if (typeof raw === 'object' && raw !== null) {
    return normalizeEmail((raw as Record<string, unknown>)['email'])
  }
  throw new Error('Malformed link row')
}

/** The signed-in user, or `null`. Checks the session cookie against D1. */
export async function currentUser(db: Database, request: Request): Promise<User | null> {
  const token = readCookie(request, SESSION_COOKIE)
  if (!token) return null
  await migrate(db, migrations)
  const [user] = await queryRows(
    db,
    `SELECT users.id, users.email FROM sessions JOIN users ON users.id = sessions.user_id
     WHERE sessions.hash = ? AND sessions.expires_at > ?`,
    [await sha256(token), now()],
    parseUser,
  )
  return user ?? null
}

/**
 * The signed-in user, or `HttpError(401)`; a state-changing request from another origin is a
 * 403. Call it at the top of any handler that needs a user.
 */
export async function requireUser(db: Database, request: Request): Promise<User> {
  checkOrigin(request)
  const user = await currentUser(db, request)
  if (!user) throw new HttpError(401, 'Sign in first')
  return user
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  const body: unknown = await request.json().catch(() => null)
  if (typeof body !== 'object' || body === null) throw new HttpError(400, 'Expected a JSON object')
  return body as Record<string, unknown>
}

/**
 * Answers `POST <base>/start { email }`, `POST <base>/verify { token }`, `GET <base>/me` and
 * `POST <base>/signout`; returns `null` for any other request.
 */
export function handleAuth(
  db: Database,
  options: AuthOptions,
): (request: Request) => Promise<Response | null> {
  const base = options.basePath ?? '/api/auth'
  const linkTtl = options.linkTtlSeconds ?? 15 * 60
  const sessionTtl = options.sessionTtlSeconds ?? 30 * 24 * 60 * 60

  const routes: Record<string, (request: Request) => Promise<Response>> = {
    'POST start': async (request) => {
      const email = normalizeEmail((await readJson(request))['email'])
      const token = randomToken()
      await db.batch([
        db.prepare('DELETE FROM auth_links WHERE expires_at <= ?').bind(now()),
        db
          .prepare('INSERT INTO auth_links (hash, email, expires_at) VALUES (?, ?, ?)')
          .bind(await sha256(token), email, now() + linkTtl),
      ])
      const url = new URL(options.verifyPath ?? '/signin/verify', request.url)
      url.searchParams.set('token', token)
      await options.sendLink(email, url.href)
      // The same answer whether or not the address has an account: nothing to enumerate.
      return Response.json({ sent: true, ...(options.exposeLink ? { link: url.href } : {}) })
    },
    'POST verify': async (request) => {
      const token = (await readJson(request))['token']
      if (typeof token !== 'string' || token.length > 100) throw new HttpError(400, 'No token')
      // Deleting and reading in one statement makes a link single-use even under a race.
      const [link] = await queryRows(
        db,
        'DELETE FROM auth_links WHERE hash = ? AND expires_at > ? RETURNING email',
        [await sha256(token), now()],
        parseLinkEmail,
      )
      if (!link) throw new HttpError(400, 'This link has expired or was already used')
      const created = new Date().toISOString()
      await db
        .prepare(
          'INSERT INTO users (id, email, created_at) VALUES (?, ?, ?) ON CONFLICT (email) DO NOTHING',
        )
        .bind(crypto.randomUUID(), link, created)
        .run()
      const [user] = await queryRows(
        db,
        'SELECT id, email FROM users WHERE email = ?',
        [link],
        parseUser,
      )
      if (!user) throw new Error('The user was not stored')
      const session = randomToken()
      await db.batch([
        db.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(now()),
        db
          .prepare('INSERT INTO sessions (hash, user_id, expires_at) VALUES (?, ?, ?)')
          .bind(await sha256(session), user.id, now() + sessionTtl),
      ])
      return Response.json(
        { user },
        { headers: { 'set-cookie': sessionCookie(session, sessionTtl) } },
      )
    },
    'GET me': async (request) => Response.json({ user: await currentUser(db, request) }),
    'POST signout': async (request) => {
      const token = readCookie(request, SESSION_COOKIE)
      if (token) {
        await db
          .prepare('DELETE FROM sessions WHERE hash = ?')
          .bind(await sha256(token))
          .run()
      }
      return Response.json({ user: null }, { headers: { 'set-cookie': sessionCookie('', 0) } })
    },
  }

  return async (request) => {
    const url = new URL(request.url)
    if (!url.pathname.startsWith(`${base}/`)) return null
    const route = routes[`${request.method} ${url.pathname.slice(base.length + 1)}`]
    if (!route) return null
    try {
      checkOrigin(request)
      await migrate(db, migrations)
      return await route(request)
    } catch (error) {
      if (error instanceof HttpError) {
        return Response.json({ error: error.message }, { status: error.status })
      }
      throw error
    }
  }
}
