import { HttpError } from '@cascivo/data'
import { migrate, queryRows } from './db'
import type { Database } from './db'

/**
 * Users and sessions, shared by `handleAuth` (`auth-server`) and `handleOAuth`
 * (`oauth-server`): one `users` table, one `sessions` table, one cookie, whichever way someone
 * signed in. Internal: published through those two entries.
 */

export interface User {
  id: string
  /** `null` for someone who signed in with a provider that shares no verified address. */
  email: string | null
}

export const SESSION_COOKIE = '__Host-session'

export const accountMigrations = [
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
  {
    // Email becomes optional, and a user can have identities at OAuth providers. SQLite cannot
    // drop a NOT NULL, so `users` is rebuilt under its own name: copied aside, dropped,
    // recreated and refilled. Never renamed, because a rename rewrites every foreign key that
    // points at it (yours included). With foreign keys deferred, the drop leaves `sessions`
    // (and any table of yours that references users) pointing nowhere only until the refill
    // puts every id back; a reference that is still dangling at commit fails the migration.
    id: 'cascivo_auth_0002',
    statements: [
      'PRAGMA defer_foreign_keys = ON',
      'CREATE TABLE users_0001 AS SELECT id, email, created_at FROM users',
      'DROP TABLE users',
      `CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        created_at TEXT NOT NULL
      )`,
      'INSERT INTO users (id, email, created_at) SELECT id, email, created_at FROM users_0001',
      'DROP TABLE users_0001',
      `CREATE TABLE IF NOT EXISTS user_identities (
        provider TEXT NOT NULL,
        subject TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES users (id),
        created_at TEXT NOT NULL,
        PRIMARY KEY (provider, subject)
      )`,
      'CREATE INDEX IF NOT EXISTS user_identities_user ON user_identities (user_id)',
    ],
  },
]

export const migrateAccounts = (db: Database): Promise<void> => migrate(db, accountMigrations)

export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

export const now = (): number => Math.floor(Date.now() / 1000)

export function readCookie(request: Request, name: string): string | null {
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return rest.join('=')
  }
  return null
}

/** A `__Host-` cookie: HttpOnly, Secure, SameSite=Lax, the whole site. `maxAge` 0 clears it. */
export function hostCookie(name: string, value: string, maxAge: number): string {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
}

/**
 * Refuses a state-changing request from another site (a form posted from elsewhere carries
 * this app's cookie only under SameSite=Lax's exceptions, and never a matching Origin).
 */
export function checkOrigin(request: Request): void {
  if (request.method === 'GET' || request.method === 'HEAD') return
  const origin = request.headers.get('origin')
  if (origin !== null && origin !== new URL(request.url).origin) {
    throw new HttpError(403, 'Cross-site request refused')
  }
}

export function parseUser(raw: unknown): User {
  if (typeof raw === 'object' && raw !== null) {
    const { id, email } = raw as Record<string, unknown>
    if (typeof id === 'string' && (typeof email === 'string' || email === null))
      return { id, email }
  }
  throw new Error('Malformed user row')
}

/** The signed-in user, or `null`. Checks the session cookie against D1. */
export async function currentUser(db: Database, request: Request): Promise<User | null> {
  const token = readCookie(request, SESSION_COOKIE)
  if (!token) return null
  await migrateAccounts(db)
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

/** Stores a new session for `userId` and returns the `Set-Cookie` value that carries it. */
export async function startSession(db: Database, userId: string, ttl: number): Promise<string> {
  const session = randomToken()
  await db.batch([
    db.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(now()),
    db
      .prepare('INSERT INTO sessions (hash, user_id, expires_at) VALUES (?, ?, ?)')
      .bind(await sha256(session), userId, now() + ttl),
  ])
  return hostCookie(SESSION_COOKIE, session, ttl)
}

/** `GET <base>/me` and `POST <base>/signout`, answered the same by both handlers. */
export function sessionRoutes(
  db: Database,
): Record<string, (request: Request) => Promise<Response>> {
  return {
    'GET me': async (request) => Response.json({ user: await currentUser(db, request) }),
    'POST signout': async (request) => {
      const token = readCookie(request, SESSION_COOKIE)
      if (token) {
        await db
          .prepare('DELETE FROM sessions WHERE hash = ?')
          .bind(await sha256(token))
          .run()
      }
      return Response.json(
        { user: null },
        { headers: { 'set-cookie': hostCookie(SESSION_COOKIE, '', 0) } },
      )
    },
  }
}
