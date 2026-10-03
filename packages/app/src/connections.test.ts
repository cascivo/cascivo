// @vitest-environment node
import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import { SESSION_COOKIE } from './auth-server'
import { OAuthError } from './oauth'
import type { OAuthProvider, TokenSet } from './oauth'
import {
  ConnectionError,
  connectionTokens,
  handleConnections,
  handleOAuth,
  listConnections,
  markReconnect,
} from './oauth-server'
import { d1 } from './sqlite.fixtures'

const ORIGIN = 'https://app.example'
const SECRET = 'a-test-secret-that-is-long-enough-0123'
const now = () => Math.floor(Date.now() / 1000)

/**
 * A provider for both sign-in and connecting. Its next grant is whatever the test says, and
 * its refresh tokens are single-use: a spent one is refused, as Bluesky and Buffer do.
 */
function provider(id: string) {
  let identity = { subject: 'acct-1', name: 'Ada' as string | null }
  let grant: TokenSet = {
    accessToken: 'at-1',
    refreshToken: null,
    expiresAt: null,
    scopes: ['post'],
  }
  let validRefresh: string | null = null
  let refreshes = 0
  const p: OAuthProvider = {
    id,
    scopes: ['post'],
    authorizationUrl(pending) {
      const url = new URL(`https://${id}.example/authorize`)
      url.searchParams.set('state', pending.state)
      return url
    },
    async exchange() {
      validRefresh = grant.refreshToken
      return {
        tokens: grant,
        identity: { provider: id, email: null, handle: null, avatarUrl: null, ...identity },
      }
    },
    async refresh(tokens) {
      refreshes += 1
      // A real refresh is a round trip: let a concurrent caller run meanwhile.
      await new Promise((resolve) => setTimeout(resolve, 20))
      if (tokens.refreshToken !== validRefresh) {
        throw new OAuthError('provider_error', 'invalid_grant: refresh token already used')
      }
      validRefresh = `rt-${refreshes + 1}`
      return {
        accessToken: `at-refreshed-${refreshes}`,
        refreshToken: validRefresh,
        expiresAt: now() + 3600,
        scopes: tokens.scopes,
      }
    },
  }
  return {
    provider: p,
    as: (next: Partial<typeof identity>) => void (identity = { ...identity, ...next }),
    grants: (tokens: Partial<TokenSet>) => void (grant = { ...grant, ...tokens }),
    refreshes: () => refreshes,
    revoke: () => void (validRefresh = null),
  }
}

function setup() {
  const sqlite = new DatabaseSync(':memory:')
  const db = d1(sqlite)
  const net = provider('net')
  const signIn = handleOAuth(db, { secret: SECRET, providers: [net.provider] })
  const connections = handleConnections(db, { secret: SECRET, providers: [net.provider] })
  const call = (
    handler: typeof signIn,
    path: string,
    cookies: string[] = [],
    init: RequestInit = {},
  ) =>
    handler(
      new Request(`${ORIGIN}${path}`, {
        ...init,
        headers: { cookie: cookies.join('; '), origin: ORIGIN },
      }),
    )
  const cookieOf = (response: Response, name: string) =>
    response.headers
      .getSetCookie()
      .map((c) => c.split(';')[0]!)
      .find((c) => c.startsWith(`${name}=`))
  /** Runs one redirect-and-callback through `handler` under `prefix`. */
  const roundTrip = async (
    handler: typeof signIn,
    prefix: string,
    cookies: string[],
    cookie: string,
  ) => {
    const start = (await call(handler, `${prefix}/net?returnTo=/settings`, cookies))!
    const pending = cookieOf(start, cookie)
    if (!pending) return start
    const state = new URL(start.headers.get('location')!).searchParams.get('state')!
    return (await call(handler, `${prefix}/net/callback?state=${state}&code=c`, [
      ...cookies,
      pending,
    ]))!
  }
  const signInAs = async (subject: string) => {
    net.as({ subject: `login-${subject}` })
    const response = await roundTrip(signIn, '/api/auth/oauth', [], '__Host-oauth')
    return cookieOf(response, SESSION_COOKIE)!
  }
  const connect = async (session: string, subject = 'acct-1') => {
    net.as({ subject })
    return roundTrip(connections, '/api/connections', [session], '__Host-connect')
  }
  const userOf = async (session: string) => {
    const me = (await (await call(signIn, '/api/auth/me', [session]))!.json()) as {
      user: { id: string }
    }
    return me.user.id
  }
  return { sqlite, db, net, connections, call, signInAs, connect, userOf }
}

describe('handleConnections', () => {
  it('needs a signed-in user', async () => {
    const { call, connections } = setup()
    expect((await call(connections, '/api/connections'))!.status).toBe(401)
    expect((await call(connections, '/api/connections/net'))!.headers.get('location')).toBe(
      `${ORIGIN}/settings?error=signed_out`,
    )
  })

  it('connects an account, lists it, and keeps its tokens sealed', async () => {
    const { sqlite, call, connections, signInAs, connect, net } = setup()
    const session = await signInAs('ada')
    net.grants({ accessToken: 'secret-access-token' })
    const done = await connect(session)
    expect(done.headers.get('location')).toBe(`${ORIGIN}/settings`)
    const list = (await (await call(connections, '/api/connections', [session]))!.json()) as {
      connections: { provider: string; subject: string; status: string; name: string }[]
    }
    expect(list.connections).toEqual([
      expect.objectContaining({
        provider: 'net',
        subject: 'acct-1',
        name: 'Ada',
        status: 'active',
      }),
    ])
    const raw = JSON.stringify(sqlite.prepare('SELECT * FROM connections').all())
    expect(raw).not.toContain('secret-access-token')
  })

  it('hands tokens only to their owner, and updates the same account on reconnect', async () => {
    const { db, signInAs, connect, userOf, net } = setup()
    const ada = await signInAs('ada')
    await connect(ada)
    const adaId = await userOf(ada)
    const [connection] = await listConnections(db, adaId)
    const options = { secret: SECRET, providers: [net.provider] }
    const { tokens } = await connectionTokens(db, options, {
      connectionId: connection!.id,
      userId: adaId,
    })
    expect(tokens.accessToken).toBe('at-1')

    const grace = await userOf(await signInAs('grace'))
    await expect(
      connectionTokens(db, options, { connectionId: connection!.id, userId: grace }),
    ).rejects.toMatchObject({ code: 'not_found' })

    net.grants({ accessToken: 'at-2' })
    await connect(ada)
    expect(await listConnections(db, adaId)).toHaveLength(1)
    const again = await connectionTokens(db, options, {
      connectionId: connection!.id,
      userId: adaId,
    })
    expect(again.tokens.accessToken).toBe('at-2')
  })

  it('removes a connection, only for its owner', async () => {
    const { db, call, connections, signInAs, connect, userOf } = setup()
    const ada = await signInAs('ada')
    await connect(ada)
    const [connection] = await listConnections(db, await userOf(ada))
    const grace = await signInAs('grace')
    await call(connections, `/api/connections/${connection!.id}`, [grace], { method: 'DELETE' })
    expect(await listConnections(db, await userOf(ada))).toHaveLength(1)
    await call(connections, `/api/connections/${connection!.id}`, [ada], { method: 'DELETE' })
    expect(await listConnections(db, await userOf(ada))).toHaveLength(0)
  })

  it('says when a token that cannot be refreshed is about to expire, then that it has', async () => {
    const { db, sqlite, signInAs, connect, userOf, net } = setup()
    const ada = await signInAs('ada')
    // LinkedIn's shape: 60 days, no refresh token. Five days left.
    net.grants({ expiresAt: now() + 5 * 86_400, refreshToken: null })
    await connect(ada)
    const adaId = await userOf(ada)
    const [connection] = await listConnections(db, adaId)
    expect(connection!.status).toBe('expiring')
    sqlite.prepare('UPDATE connections SET expires_at = ?').run(now() - 10)
    expect((await listConnections(db, adaId))[0]!.status).toBe('reconnect')
    // The sealed token still says it is valid for days; the stored expiry is not what decides.
    const options = { secret: SECRET, providers: [net.provider] }
    sqlite.prepare('UPDATE connections SET expires_at = ?').run(now() + 5 * 86_400)
    await markReconnect(db, connection!.id)
    await expect(
      connectionTokens(db, options, { connectionId: connection!.id, userId: adaId }),
    ).rejects.toBeInstanceOf(ConnectionError)
    // Connecting again clears it.
    await connect(ada)
    expect((await listConnections(db, adaId))[0]!.status).toBe('expiring')
  })

  it('refreshes an expired token once, even when two requests ask at the same moment', async () => {
    const { db, signInAs, connect, userOf, net } = setup()
    const ada = await signInAs('ada')
    net.grants({ accessToken: 'at-old', refreshToken: 'rt-1', expiresAt: now() - 1 })
    await connect(ada)
    const adaId = await userOf(ada)
    const [connection] = await listConnections(db, adaId)
    const options = { secret: SECRET, providers: [net.provider] }
    const where = { connectionId: connection!.id, userId: adaId }
    const [a, b] = await Promise.all([
      connectionTokens(db, options, where),
      connectionTokens(db, options, where),
    ])
    // The single-use refresh token was spent once, and both callers got its result.
    expect(net.refreshes()).toBe(1)
    expect(a.tokens.accessToken).toBe('at-refreshed-1')
    expect(b.tokens.accessToken).toBe('at-refreshed-1')
    expect(a.connection.status).toBe('active')
    // Later calls use the stored, still-valid token without refreshing.
    expect((await connectionTokens(db, options, where)).tokens.refreshToken).toBe('rt-2')
    expect(net.refreshes()).toBe(1)
  })

  it('marks the connection for reconnecting when the provider refuses the refresh', async () => {
    const { db, signInAs, connect, userOf, net } = setup()
    const ada = await signInAs('ada')
    net.grants({ refreshToken: 'rt-1', expiresAt: now() - 1 })
    await connect(ada)
    const adaId = await userOf(ada)
    const [connection] = await listConnections(db, adaId)
    // The user removed the app at the provider: its refresh token is dead.
    net.revoke()
    const options = { secret: SECRET, providers: [net.provider] }
    const where = { connectionId: connection!.id, userId: adaId }
    await expect(connectionTokens(db, options, where)).rejects.toMatchObject({ code: 'reconnect' })
    expect((await listConnections(db, adaId))[0]!.status).toBe('reconnect')
    // And it stays refused without asking the provider again.
    await expect(connectionTokens(db, options, where)).rejects.toMatchObject({ code: 'reconnect' })
    expect(net.refreshes()).toBe(1)
  })

  it('treats tokens sealed under another secret as needing a reconnect', async () => {
    const { db, signInAs, connect, userOf, net } = setup()
    const ada = await signInAs('ada')
    await connect(ada)
    const adaId = await userOf(ada)
    const [connection] = await listConnections(db, adaId)
    await expect(
      connectionTokens(
        db,
        { secret: `${SECRET}-rotated`, providers: [net.provider] },
        { connectionId: connection!.id, userId: adaId },
      ),
    ).rejects.toMatchObject({ code: 'reconnect' })
  })
})
