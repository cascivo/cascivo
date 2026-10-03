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
import { migrate, queryRows } from './db'
import type { Database } from './db'
import {
  beginAuthorization,
  completeAuthorization,
  OAuthError,
  parsePendingAuthorization,
  parseTokenSet,
  seal,
  unseal,
} from './oauth'
import type {
  CompletedAuthorization,
  Identity,
  MastodonRegistration,
  MastodonRegistrations,
  OAuthErrorCode,
  OAuthProvider,
  PendingAuthorization,
  TokenSet,
} from './oauth'

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

function providerMap(list: readonly OAuthProvider[]): Map<string, OAuthProvider> {
  const providers = new Map<string, OAuthProvider>()
  for (const provider of list) {
    if (!ID.test(provider.id)) throw new Error(`Provider id "${provider.id}" is not a URL segment`)
    if (providers.has(provider.id)) throw new Error(`Provider "${provider.id}" is listed twice`)
    providers.set(provider.id, provider)
  }
  return providers
}

const notConfigured = () =>
  Response.json(
    { error: 'Sign-in is not configured: set a secret of at least 32 characters' },
    { status: 500 },
  )

/**
 * The redirect to a provider and the way back, with its state in a sealed cookie. Sign-in and
 * connecting an account each have their own cookie and sealing context, so neither flow can
 * finish the other's.
 */
function redirectFlow(config: {
  secret: string
  cookie: string
  context: string
  errorPath: string
  callbackPath: (provider: OAuthProvider) => string
}) {
  const clear = hostCookie(config.cookie, '', 0)
  const fail = (code: string, origin: string): Response => {
    const url = new URL(config.errorPath, origin)
    url.searchParams.set('error', code)
    return redirect(url.href, [clear])
  }
  return {
    clear,
    fail,
    async start(provider: OAuthProvider, request: Request, origin: string): Promise<Response> {
      const params = new URL(request.url).searchParams
      const returnTo = safeReturnTo(params.get('returnTo'), origin)
      const redirectUri = `${origin}${config.callbackPath(provider)}`
      // A provider that is many servers (Mastodon, Bluesky) starts at the one the user named,
      // `?server=`: a host, a handle or a DID, which the provider itself checks and resolves.
      let server: string | undefined
      let resolved = provider
      if (provider.forServer) {
        try {
          resolved = await provider.forServer(params.get('server') ?? '', redirectUri)
          server = resolved.server
        } catch (error) {
          if (error instanceof OAuthError) {
            console.warn(`[cascivo/oauth] ${provider.id}: ${error.code}: ${error.message}`)
            return fail(error.code, origin)
          }
          throw error
        }
      }
      const { url, pending } = await beginAuthorization(resolved, {
        redirectUri,
        ttlSeconds: PENDING_TTL,
        ...(server ? { server } : {}),
      })
      const sealed = await seal(config.secret, config.context, {
        authorization: pending,
        returnTo,
      } satisfies Pending)
      return redirect(url, [hostCookie(config.cookie, sealed, PENDING_TTL)])
    },
    /** The completed flow, or the redirect that reports why it failed. */
    async finish(
      provider: OAuthProvider,
      request: Request,
      origin: string,
    ): Promise<{ completed: CompletedAuthorization; returnTo: string } | Response> {
      const cookie = readCookie(request, config.cookie)
      // No cookie: it expired, or the callback was opened in another browser than the start.
      if (!cookie) return fail('expired', origin)
      const pending = parsePending(await unseal(config.secret, config.context, cookie))
      if (!pending) return fail('state_mismatch', origin)
      try {
        const { server, redirectUri } = pending.authorization
        const resolved =
          provider.forServer && server ? await provider.forServer(server, redirectUri) : provider
        const completed = await completeAuthorization(
          resolved,
          pending.authorization,
          new URL(request.url).searchParams,
        )
        return { completed, returnTo: pending.returnTo }
      } catch (error) {
        if (error instanceof OAuthError) {
          console.warn(`[cascivo/oauth] ${provider.id}: ${error.code}: ${error.message}`)
          return fail(error.code, origin)
        }
        throw error
      }
    },
  }
}

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
  const sessionTtl = options.sessionTtlSeconds ?? 30 * 24 * 60 * 60
  const providers = providerMap(options.providers)
  const shared = sessionRoutes(db)
  const flow = redirectFlow({
    secret: options.secret,
    cookie: '__Host-oauth',
    context: 'cascivo-oauth-pending',
    errorPath: options.errorPath ?? '/signin',
    callbackPath: (provider) => `${base}/oauth/${provider.id}/callback`,
  })

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

  async function callback(provider: OAuthProvider, request: Request, origin: string) {
    const finished = await flow.finish(provider, request, origin)
    if (finished instanceof Response) return finished
    await migrateAccounts(db)
    const userId = await userFor(finished.completed.identity, request)
    if (!userId) return flow.fail('identity_in_use' satisfies OAuthFailure, origin)
    return redirect(new URL(finished.returnTo, origin).href, [
      flow.clear,
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
    if (options.secret.length < 32) return notConfigured()
    const origin = options.origin ? new URL(options.origin).origin : url.origin
    return match[2] ? callback(provider, request, origin) : flow.start(provider, request, origin)
  }
}

/* ------------------------------ Connected accounts ------------------------------ */

/**
 * An account at a provider that a user connected so the app can act for them: post, read a
 * calendar. Distinct from sign-in: the tokens are kept (sealed), not discarded.
 */
export interface Connection {
  id: string
  userId: string
  provider: string
  /** The account at the provider: the subject `social` publishers post as. */
  subject: string
  /** The server the account lives on, for a provider that is many (Mastodon); else `null`. */
  server: string | null
  name: string | null
  handle: string | null
  scopes: string[]
  /** When the access token expires (Unix seconds), `null` when it does not. */
  expiresAt: number | null
  /**
   * `reconnect`: the tokens no longer work (refused, expired with no way to refresh, or the
   * secret changed). `expiring`: they will stop within `expiringDays` and cannot be refreshed,
   * so ask the user to connect again (LinkedIn's 60-day tokens; a Threads token that
   * `refreshConnections` has not managed to renew).
   */
  status: 'active' | 'expiring' | 'reconnect'
}

export interface ConnectionsOptions {
  /**
   * The providers a user can connect, built with the scopes the app needs, e.g.
   * `linkedin({ …, scopes: ['openid', 'profile', 'w_member_social'] })`. Each is answered at
   * `<base>/<provider.id>`.
   */
  providers: readonly OAuthProvider[]
  /** Seals the tokens at rest and the flow's state: at least 32 characters. */
  secret: string
  /** Default `/api/connections`. */
  basePath?: string
  /** As in `handleOAuth`: pins the redirect URI's origin. */
  origin?: string
  /**
   * The page a failed connection returns to, with `?error=`: the sign-in codes, or
   * `signed_out` when nobody is signed in to connect an account to. Default `/settings`.
   */
  errorPath?: string
  /** How early a token that cannot be refreshed counts as `expiring`. Default 7. */
  expiringDays?: number
}

/** Why `connectionTokens` cannot hand out tokens. */
export class ConnectionError extends Error {
  constructor(
    readonly code: 'not_found' | 'reconnect',
    message: string,
  ) {
    super(message)
    this.name = 'ConnectionError'
  }
}

const connectionMigrations = [
  {
    id: 'cascivo_connections_0001',
    statements: [
      `CREATE TABLE IF NOT EXISTS connections (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users (id),
        provider TEXT NOT NULL,
        subject TEXT NOT NULL,
        server TEXT,
        name TEXT,
        handle TEXT,
        scopes TEXT NOT NULL,
        expires_at INTEGER,
        refreshable INTEGER NOT NULL,
        broken INTEGER NOT NULL DEFAULT 0,
        lease_until INTEGER,
        sealed_tokens TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (user_id, provider, subject)
      )`,
      'CREATE INDEX IF NOT EXISTS connections_user ON connections (user_id)',
      `CREATE TABLE IF NOT EXISTS oauth_clients (
        key TEXT PRIMARY KEY,
        sealed TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
    ],
  },
]

async function migrateConnections(db: Database): Promise<void> {
  await migrateAccounts(db)
  await migrate(db, connectionMigrations)
}

/** The sealing context binds tokens to their row: a sealed blob copied to another row is useless. */
const tokenContext = (connectionId: string) => `cascivo-connection:${connectionId}`

interface ConnectionRow {
  connection: Connection
  sealed: string
  version: number
  /** Refused by the provider, or its tokens could not be opened. */
  broken: boolean
}

const COLUMNS =
  'id, user_id, provider, subject, server, name, handle, scopes, expires_at, refreshable, broken, sealed_tokens, version'

function connectionRowParser(expiringDays: number) {
  return (raw: unknown): ConnectionRow => {
    if (typeof raw !== 'object' || raw === null) throw new Error('Malformed connection row')
    const r = raw as Record<string, unknown>
    const text = (key: string) => {
      const value = r[key]
      if (typeof value !== 'string') throw new Error(`Malformed connection row: ${key}`)
      return value
    }
    const optional = (key: string) => (typeof r[key] === 'string' ? (r[key] as string) : null)
    const expiresAt = typeof r['expires_at'] === 'number' ? r['expires_at'] : null
    const refreshable = r['refreshable'] === 1
    const status: Connection['status'] =
      r['broken'] === 1 || (expiresAt !== null && !refreshable && expiresAt <= now())
        ? 'reconnect'
        : expiresAt !== null && !refreshable && expiresAt <= now() + expiringDays * 86_400
          ? 'expiring'
          : 'active'
    return {
      connection: {
        id: text('id'),
        userId: text('user_id'),
        provider: text('provider'),
        subject: text('subject'),
        server: optional('server'),
        name: optional('name'),
        handle: optional('handle'),
        scopes: text('scopes').split(' ').filter(Boolean),
        expiresAt,
        status,
      },
      sealed: text('sealed_tokens'),
      version: Number(r['version']),
      broken: r['broken'] === 1,
    }
  }
}

const now = () => Math.floor(Date.now() / 1000)
/** Seconds one request may hold a connection's refresh before another may take it over. */
const REFRESH_LEASE = 15
const REFRESH_POLL_MS = 100

async function readConnection(
  db: Database,
  where: { id: string; userId: string },
  expiringDays = 7,
): Promise<ConnectionRow | null> {
  const [row] = await queryRows(
    db,
    `SELECT ${COLUMNS} FROM connections WHERE id = ? AND user_id = ?`,
    [where.id, where.userId],
    connectionRowParser(expiringDays),
  )
  return row ?? null
}

/** The user's connected accounts, newest first. */
export async function listConnections(
  db: Database,
  userId: string,
  options: { expiringDays?: number } = {},
): Promise<Connection[]> {
  await migrateConnections(db)
  const rows = await queryRows(
    db,
    `SELECT ${COLUMNS} FROM connections WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
    connectionRowParser(options.expiringDays ?? 7),
  )
  return rows.map((row) => row.connection)
}

/**
 * Marks a connection as needing to be connected again: call it when the provider refuses its
 * token (a `PublishError` of kind `reconnect`).
 */
export async function markReconnect(db: Database, connectionId: string): Promise<void> {
  await migrateConnections(db)
  await db
    .prepare('UPDATE connections SET broken = 1, updated_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), connectionId)
    .run()
}

async function storeTokens(
  db: Database,
  secret: string,
  connectionId: string,
  tokens: TokenSet,
  expectedVersion: number,
): Promise<boolean> {
  // Conditional on the version read: of two refreshes racing, exactly one is stored.
  const updated = await queryRows(
    db,
    `UPDATE connections SET sealed_tokens = ?, scopes = ?, expires_at = ?, refreshable = ?,
       broken = 0, lease_until = NULL, version = version + 1, updated_at = ?
     WHERE id = ? AND version = ? RETURNING id`,
    [
      await seal(secret, tokenContext(connectionId), tokens),
      tokens.scopes.join(' '),
      tokens.expiresAt,
      tokens.refreshToken ? 1 : 0,
      new Date().toISOString(),
      connectionId,
      expectedVersion,
    ],
    (raw) => raw,
  )
  return updated.length === 1
}

/**
 * A connection's current tokens, for the user who owns it. Refreshes an access token that
 * expires within a minute, when the provider can; a provider that renews its own token
 * (`refreshAhead`, Threads) is renewed early, and a failed early renewal keeps the working token. Throws `ConnectionError`: `not_found`, or
 * `reconnect` when the tokens cannot be used or renewed (and marks the connection so).
 *
 * Refresh tokens that the provider replaces on every use (Bluesky, Buffer) are safe here: one
 * request at a time holds a short lease on the refresh, and the others wait for its result
 * instead of spending a refresh token that is already gone.
 */
export async function connectionTokens(
  db: Database,
  options: { secret: string; providers: readonly OAuthProvider[] },
  where: { connectionId: string; userId: string },
): Promise<{ connection: Connection; tokens: TokenSet }> {
  await migrateConnections(db)
  const load = async () => {
    const row = await readConnection(db, { id: where.connectionId, userId: where.userId })
    if (!row) throw new ConnectionError('not_found', 'No such connection')
    let tokens: TokenSet | null = null
    try {
      tokens = parseTokenSet(
        await unseal(options.secret, tokenContext(row.connection.id), row.sealed),
      )
    } catch {
      // unseal gave null: another secret, or a damaged row.
    }
    return { row, tokens }
  }
  const broken = async (why: string): Promise<never> => {
    await markReconnect(db, where.connectionId)
    throw new ConnectionError('reconnect', why)
  }

  const { row, tokens } = await load()
  if (row.broken) throw new ConnectionError('reconnect', 'Connect the account again')
  if (!tokens) return broken('The stored tokens cannot be opened: connect the account again')
  const provider = options.providers.find((p) => p.id === row.connection.provider)
  const ahead = provider?.refreshAhead
  const valid = tokens.expiresAt === null || tokens.expiresAt - 60 > now()
  if (
    valid &&
    (ahead === undefined || tokens.expiresAt === null || tokens.expiresAt - ahead > now())
  ) {
    return { connection: row.connection, tokens }
  }
  // A token that renews itself (Threads) can be renewed only while it still works.
  if (!provider?.refresh || !(tokens.refreshToken || (ahead !== undefined && valid))) {
    return broken('The access token has expired: connect the account again')
  }
  // One refresh at a time per connection. A provider that replaces its refresh token on every
  // use (Bluesky, Buffer) would refuse a second refresh with the spent one, so the others wait
  // for the stored result instead of calling.
  const [lease] = await queryRows(
    db,
    `UPDATE connections SET lease_until = ?
     WHERE id = ? AND version = ? AND (lease_until IS NULL OR lease_until < ?) RETURNING id`,
    [now() + REFRESH_LEASE, row.connection.id, row.version, now()],
    (raw) => raw,
  )
  if (!lease) {
    // Renewing early: the current token still works, so there is nothing to wait for.
    if (valid) return { connection: row.connection, tokens }
    for (let waited = 0; waited < REFRESH_LEASE * 1000; waited += REFRESH_POLL_MS) {
      await new Promise((resolve) => setTimeout(resolve, REFRESH_POLL_MS))
      const again = await load()
      if (again.row.broken) throw new ConnectionError('reconnect', 'Connect the account again')
      if (again.tokens && again.row.version !== row.version) {
        return { connection: again.row.connection, tokens: again.tokens }
      }
    }
    throw new Error('Timed out waiting for another request to renew the tokens')
  }
  let fresh: TokenSet
  try {
    fresh = await provider.refresh(tokens)
  } catch (error) {
    await db
      .prepare('UPDATE connections SET lease_until = NULL WHERE id = ?')
      .bind(row.connection.id)
      .run()
    // An early renewal that failed leaves a token that still works; the next call tries again.
    if (valid) {
      console.warn('[cascivo/oauth] could not renew a token ahead of its expiry:', error)
      return { connection: row.connection, tokens }
    }
    if (error instanceof OAuthError)
      return broken(`The provider refused to renew: ${error.message}`)
    throw error
  }
  // Holding the lease, the version cannot have moved; the condition is belt and braces.
  if (!(await storeTokens(db, options.secret, row.connection.id, fresh, row.version))) {
    throw new Error('The renewed tokens were not stored')
  }
  const stored = await readConnection(db, { id: row.connection.id, userId: where.userId })
  return { connection: stored?.connection ?? row.connection, tokens: fresh }
}

/**
 * Renews every connection whose provider renews its own token (`refreshAhead`: Threads) and
 * that is inside that window. Call it from a daily Cron Trigger: such a token can be renewed
 * only while it still works, so one nobody posts with would otherwise lapse. A connection that
 * could not be renewed keeps its working token and is tried again on the next run.
 */
export async function refreshConnections(
  db: Database,
  options: { secret: string; providers: readonly OAuthProvider[] },
): Promise<{ renewed: number; failed: number }> {
  await migrateConnections(db)
  let renewed = 0
  let failed = 0
  for (const provider of options.providers) {
    if (provider.refreshAhead === undefined || !provider.refresh) continue
    const due = await queryRows(
      db,
      `SELECT id, user_id, expires_at FROM connections
       WHERE provider = ? AND broken = 0 AND expires_at > ? AND expires_at <= ?`,
      [provider.id, now() + 60, now() + provider.refreshAhead],
      (raw) => {
        if (typeof raw !== 'object' || raw === null) throw new Error('Malformed connection row')
        const r = raw as Record<string, unknown>
        const { id, user_id: userId, expires_at: expiresAt } = r
        if (typeof id !== 'string' || typeof userId !== 'string' || typeof expiresAt !== 'number') {
          throw new Error('Malformed connection row')
        }
        return { id, userId, expiresAt }
      },
    )
    for (const row of due) {
      try {
        const { tokens } = await connectionTokens(db, options, {
          connectionId: row.id,
          userId: row.userId,
        })
        if (tokens.expiresAt !== row.expiresAt) renewed += 1
        else failed += 1
      } catch (error) {
        console.warn(`[cascivo/oauth] could not renew connection ${row.id}:`, error)
        failed += 1
      }
    }
  }
  return { renewed, failed }
}

/**
 * Answers, for the signed-in user: `GET <base>` (their connections), `GET <base>/<provider>`
 * (redirects to connect; `?returnTo=` is where to land), `GET <base>/<provider>/callback`, and
 * `DELETE <base>/<connection id>`. Returns `null` for any other request.
 *
 * Connecting the same account again (to renew a 60-day token, or grant more scopes) updates the
 * existing connection. Removing one deletes the stored tokens; it does not revoke them at the
 * provider, where the user can remove the app.
 */
export function handleConnections(
  db: Database,
  options: ConnectionsOptions,
): (request: Request) => Promise<Response | null> {
  const base = options.basePath ?? '/api/connections'
  const expiringDays = options.expiringDays ?? 7
  const providers = providerMap(options.providers)
  const flow = redirectFlow({
    secret: options.secret,
    cookie: '__Host-connect',
    context: 'cascivo-connect-pending',
    errorPath: options.errorPath ?? '/settings',
    callbackPath: (provider) => `${base}/${provider.id}/callback`,
  })

  async function store(userId: string, completed: CompletedAuthorization): Promise<void> {
    const { identity, tokens } = completed
    const created = new Date().toISOString()
    // The id must exist before the tokens are sealed to it, so: claim the row, then fill it.
    await db
      .prepare(
        `INSERT INTO connections (id, user_id, provider, subject, scopes, refreshable, sealed_tokens,
           created_at, updated_at)
         VALUES (?, ?, ?, ?, '', 0, '', ?, ?)
         ON CONFLICT (user_id, provider, subject) DO NOTHING`,
      )
      .bind(crypto.randomUUID(), userId, identity.provider, identity.subject, created, created)
      .run()
    const [row] = await queryRows(
      db,
      `SELECT ${COLUMNS} FROM connections WHERE user_id = ? AND provider = ? AND subject = ?`,
      [userId, identity.provider, identity.subject],
      connectionRowParser(expiringDays),
    )
    if (!row) throw new Error('The connection was not stored')
    await db
      .prepare('UPDATE connections SET server = ?, name = ?, handle = ? WHERE id = ?')
      .bind(identity.server ?? null, identity.name, identity.handle, row.connection.id)
      .run()
    if (!(await storeTokens(db, options.secret, row.connection.id, tokens, row.version))) {
      // A second callback for the same account landed in between; its tokens are as new.
      console.warn('[cascivo/oauth] connection stored twice at once; kept the other write')
    }
  }

  return async (request) => {
    const url = new URL(request.url)
    if (url.pathname !== base && !url.pathname.startsWith(`${base}/`)) return null
    const rest = url.pathname.slice(base.length + 1)
    const origin = options.origin ? new URL(options.origin).origin : url.origin
    try {
      checkOrigin(request)
      if (request.method === 'GET' && url.pathname === base) {
        const user = await currentUser(db, request)
        if (!user) throw new HttpError(401, 'Sign in first')
        return Response.json({ connections: await listConnections(db, user.id, { expiringDays }) })
      }
      if (request.method === 'DELETE' && rest) {
        const user = await currentUser(db, request)
        if (!user) throw new HttpError(401, 'Sign in first')
        await migrateConnections(db)
        await db
          .prepare('DELETE FROM connections WHERE id = ? AND user_id = ?')
          .bind(rest, user.id)
          .run()
        return Response.json({ removed: rest })
      }
    } catch (error) {
      if (error instanceof HttpError) {
        return Response.json({ error: error.message }, { status: error.status })
      }
      throw error
    }
    if (request.method !== 'GET') return null
    const match = /^([^/]+)(\/callback)?$/.exec(rest)
    const provider = match ? providers.get(match[1]!) : undefined
    if (!match || !provider) return null
    if (options.secret.length < 32) return notConfigured()
    const user = await currentUser(db, request)
    if (!user) return flow.fail('signed_out', origin)
    if (!match[2]) return flow.start(provider, request, origin)
    const finished = await flow.finish(provider, request, origin)
    if (finished instanceof Response) return finished
    await migrateConnections(db)
    await store(user.id, finished.completed)
    return redirect(new URL(finished.returnTo, origin).href, [flow.clear])
  }
}

/**
 * Where `mastodon()` keeps the app registration each server issued, in D1, its client secret
 * sealed under `secret`. A registration that no longer opens (the secret changed) is made again.
 */
export function mastodonRegistrations(db: Database, secret: string): MastodonRegistrations {
  const context = (key: string) => `cascivo-oauth-client:${key}`
  return {
    async get(key) {
      await migrateConnections(db)
      const [row] = await queryRows(
        db,
        'SELECT sealed FROM oauth_clients WHERE key = ?',
        [key],
        (raw) =>
          typeof raw === 'object' && raw !== null
            ? (raw as Record<string, unknown>)['sealed']
            : null,
      )
      if (typeof row !== 'string') return null
      return parseRegistration(await unseal(secret, context(key), row))
    },
    async set(key, registration) {
      await migrateConnections(db)
      await db
        .prepare(
          `INSERT INTO oauth_clients (key, sealed, created_at) VALUES (?, ?, ?)
           ON CONFLICT (key) DO UPDATE SET sealed = excluded.sealed, created_at = excluded.created_at`,
        )
        .bind(key, await seal(secret, context(key), registration), new Date().toISOString())
        .run()
    },
  }
}

function parseRegistration(raw: unknown): MastodonRegistration | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const { clientId, clientSecret, authorizationEndpoint, tokenEndpoint, pkce, scopes } = r
  if (
    typeof clientId === 'string' &&
    typeof clientSecret === 'string' &&
    typeof authorizationEndpoint === 'string' &&
    typeof tokenEndpoint === 'string' &&
    typeof pkce === 'boolean' &&
    Array.isArray(scopes) &&
    scopes.every((x) => typeof x === 'string')
  ) {
    return { clientId, clientSecret, authorizationEndpoint, tokenEndpoint, pkce, scopes }
  }
  return null
}
