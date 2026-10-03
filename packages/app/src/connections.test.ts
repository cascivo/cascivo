// @vitest-environment node
import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it, vi } from 'vitest'
import { SESSION_COOKIE } from './auth-server'
import { OAuthError } from './oauth'
import type { OAuthProvider, TokenSet } from './oauth'
import {
  ConnectionError,
  connectionTokens,
  handleConnections,
  handleOAuth,
  expiringConnections,
  listConnections,
  markReconnect,
  refreshConnections,
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
  let identity = { subject: 'acct-1', name: 'Ada' as string | null, email: null as string | null }
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
        identity: { provider: id, handle: null, avatarUrl: null, ...identity },
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
  const signInAs = async (subject: string, email: string | null = null) => {
    net.as({ subject: `login-${subject}`, email })
    const response = await roundTrip(signIn, '/api/auth/oauth', [], '__Host-oauth')
    return cookieOf(response, SESSION_COOKIE)!
  }
  const connect = async (session: string, subject = 'acct-1') => {
    net.as({ subject, email: null })
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

  it('lists every user’s connections that will lapse soon, with the owner’s email', async () => {
    const { db, signInAs, connect, net } = setup()
    const ada = await signInAs('ada', 'ada@example.com')
    const bob = await signInAs('bob')
    // LinkedIn's shape: no refresh token. Ada's ends in 3 days, Bob's in 5, Ada's other in 30.
    net.grants({ refreshToken: null, expiresAt: now() + 3 * 86_400 })
    await connect(ada, 'li-ada')
    net.grants({ expiresAt: now() + 5 * 86_400 })
    await connect(bob, 'li-bob')
    net.grants({ expiresAt: now() + 30 * 86_400 })
    await connect(ada, 'li-ada-2')
    // Refreshable ones renew themselves: not listed.
    net.grants({ refreshToken: 'rt-1', expiresAt: now() + 86_400 })
    await connect(bob, 'refreshable')
    const soon = await expiringConnections(db)
    expect(soon.map((s) => [s.connection.subject, s.email, s.connection.status])).toEqual([
      ['li-ada', 'ada@example.com', 'expiring'],
      ['li-bob', null, 'expiring'],
    ])
    expect((await expiringConnections(db, { withinDays: 31 })).length).toBe(3)
    // One already refused is not "expiring": it needs a reconnect now, and says so on the page.
    await markReconnect(db, soon[0]!.connection.id)
    expect((await expiringConnections(db)).map((s) => s.connection.subject)).toEqual(['li-bob'])
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

  describe('a token that renews itself (Threads)', () => {
    const DAY = 86_400
    /** The same provider, renewing its own token as Threads does: no refresh token. */
    function selfRenewing(base: OAuthProvider) {
      let renewals = 0
      let refuse = false
      const provider: OAuthProvider = {
        ...base,
        refreshAhead: 30 * DAY,
        async refresh(tokens) {
          renewals += 1
          await new Promise((resolve) => setTimeout(resolve, 20))
          if (refuse) throw new OAuthError('provider_error', 'Session has expired')
          return { ...tokens, accessToken: `renewed-${renewals}`, expiresAt: now() + 60 * DAY }
        },
      }
      return { provider, renewals: () => renewals, refuse: () => void (refuse = true) }
    }

    async function connected(daysLeft: number) {
      const t = setup()
      const ada = await t.signInAs('ada')
      t.net.grants({ accessToken: 'long', refreshToken: null, expiresAt: now() + daysLeft * DAY })
      await t.connect(ada)
      const adaId = await t.userOf(ada)
      const [connection] = await listConnections(t.db, adaId)
      const renewing = selfRenewing(t.net.provider)
      const options = { secret: SECRET, providers: [renewing.provider] }
      return {
        ...t,
        adaId,
        renewing,
        options,
        where: { connectionId: connection!.id, userId: adaId },
      }
    }

    it('is left alone until its renewal window, then renewed once', async () => {
      const early = await connected(45)
      expect(
        (await connectionTokens(early.db, early.options, early.where)).tokens.accessToken,
      ).toBe('long')
      expect(early.renewing.renewals()).toBe(0)

      const due = await connected(20)
      const [a, b] = await Promise.all([
        connectionTokens(due.db, due.options, due.where),
        connectionTokens(due.db, due.options, due.where),
      ])
      expect(due.renewing.renewals()).toBe(1)
      // The one that found the renewal under way did not wait: its token still works.
      expect([a.tokens.accessToken, b.tokens.accessToken].sort()).toEqual(['long', 'renewed-1'])
      expect((await connectionTokens(due.db, due.options, due.where)).tokens.accessToken).toBe(
        'renewed-1',
      )
      expect((await listConnections(due.db, due.adaId))[0]!.status).toBe('active')
    })

    it('keeps the working token when renewal fails, and says so in its last week', async () => {
      const t = await connected(5)
      t.renewing.refuse()
      expect((await connectionTokens(t.db, t.options, t.where)).tokens.accessToken).toBe('long')
      expect((await listConnections(t.db, t.adaId))[0]!.status).toBe('expiring')
      // Not marked broken: the next call tries again.
      await connectionTokens(t.db, t.options, t.where)
      expect(t.renewing.renewals()).toBe(2)
    })

    it('cannot be renewed once it has expired', async () => {
      const t = await connected(-1)
      await expect(connectionTokens(t.db, t.options, t.where)).rejects.toMatchObject({
        code: 'reconnect',
      })
      expect(t.renewing.renewals()).toBe(0)
      expect((await listConnections(t.db, t.adaId))[0]!.status).toBe('reconnect')
    })

    it('refreshConnections renews those in the window, and counts the ones it could not', async () => {
      const t = await connected(10)
      const other = { ...t.where }
      // A second account of the same user, outside the window.
      t.net.grants({ accessToken: 'fresh', expiresAt: now() + 50 * DAY })
      await t.connect(await t.signInAs('ada'), 'acct-2')
      expect(await refreshConnections(t.db, t.options)).toEqual({ renewed: 1, failed: 0 })
      expect((await connectionTokens(t.db, t.options, other)).tokens.accessToken).toBe('renewed-1')
      // Renewed: no longer due.
      expect(await refreshConnections(t.db, t.options)).toEqual({ renewed: 0, failed: 0 })
      // A provider without refreshAhead is not touched.
      expect(
        await refreshConnections(t.db, { secret: SECRET, providers: [t.net.provider] }),
      ).toEqual({ renewed: 0, failed: 0 })

      // 45 days on, both are due (15 and 5 days left), and Meta refuses.
      vi.useFakeTimers({ toFake: ['Date'], now: Date.now() + 45 * DAY * 1000 })
      try {
        t.renewing.refuse()
        expect(await refreshConnections(t.db, t.options)).toEqual({ renewed: 0, failed: 2 })
      } finally {
        vi.useRealTimers()
      }
    })
  })
})
