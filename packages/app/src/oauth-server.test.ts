// @vitest-environment node
import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import { handleAuth, requireUser, SESSION_COOKIE } from './auth-server'
import { migrate } from './db'
import type { Identity, OAuthProvider } from './oauth'
import { handleOAuth } from './oauth-server'
import type { OAuthServerOptions } from './oauth-server'
import { d1 } from './sqlite.fixtures'

const ORIGIN = 'https://app.example'
const SECRET = 'a-test-secret-that-is-long-enough-0123'

/** A provider whose next sign-in is whoever the test says, and which can refuse. */
function scripted(id: string) {
  let next: Partial<Identity> & { subject: string } = { subject: '1' }
  const provider: OAuthProvider = {
    id,
    scopes: ['profile'],
    authorizationUrl(pending, challenge) {
      const url = new URL(`https://${id}.example/authorize`)
      url.searchParams.set('state', pending.state)
      url.searchParams.set('redirect_uri', pending.redirectUri)
      url.searchParams.set('code_challenge', challenge)
      return url
    },
    async exchange() {
      return {
        tokens: { accessToken: 't', refreshToken: null, expiresAt: null, scopes: [] },
        identity: { provider: id, email: null, name: null, handle: null, avatarUrl: null, ...next },
      }
    },
  }
  return { provider, as: (identity: typeof next) => void (next = identity) }
}

function setup(options: Partial<OAuthServerOptions> = {}) {
  const sqlite = new DatabaseSync(':memory:')
  const db = d1(sqlite)
  const alpha = scripted('alpha')
  const beta = scripted('beta')
  const oauth = handleOAuth(db, {
    secret: SECRET,
    providers: [alpha.provider, beta.provider],
    ...options,
  })
  const sent: string[] = []
  const magic = handleAuth(db, { sendLink: async (_email, url) => void sent.push(url) })

  const get = (path: string, cookies: string[] = []) =>
    oauth(new Request(`${ORIGIN}${path}`, { headers: { cookie: cookies.join('; ') } }))
  const cookieOf = (response: Response, name: string) =>
    response.headers
      .getSetCookie()
      .map((c) => c.split(';')[0]!)
      .find((c) => c.startsWith(`${name}=`))

  /** Runs a whole sign-in; returns the callback response and the session cookie, if any. */
  const signIn = async (
    provider = 'alpha',
    { cookies = [] as string[], returnTo = '/dash', query = {} as Record<string, string> } = {},
  ) => {
    const start = (await get(
      `/api/auth/oauth/${provider}?returnTo=${encodeURIComponent(returnTo)}`,
      cookies,
    ))!
    const pending = cookieOf(start, '__Host-oauth')!
    const state = new URL(start.headers.get('location')!).searchParams.get('state')!
    const params = new URLSearchParams({ state, code: 'c', ...query })
    const response = (await get(`/api/auth/oauth/${provider}/callback?${params}`, [
      ...cookies,
      pending,
    ]))!
    return { start, response, session: cookieOf(response, SESSION_COOKIE) }
  }
  const whoIs = async (session: string | undefined) =>
    requireUser(db, new Request(`${ORIGIN}/api/x`, { headers: { cookie: session ?? '' } }))

  return { sqlite, db, oauth, alpha, beta, magic, sent, get, signIn, whoIs, cookieOf }
}

describe('handleOAuth', () => {
  it('lists its providers, and leaves other paths alone', async () => {
    const { get, oauth } = setup()
    expect(await (await get('/api/auth/oauth'))!.json()).toEqual({ providers: ['alpha', 'beta'] })
    expect(await get('/api/auth/oauth/gamma')).toBeNull()
    expect(await get('/api/other')).toBeNull()
    expect(
      await oauth(new Request(`${ORIGIN}/api/auth/oauth/alpha`, { method: 'POST' })),
    ).toBeNull()
  })

  it('redirects to the provider with a sealed, short-lived, host-only state cookie', async () => {
    const { get } = setup()
    const response = (await get('/api/auth/oauth/alpha?returnTo=/dash'))!
    expect(response.status).toBe(302)
    const location = new URL(response.headers.get('location')!)
    expect(location.origin).toBe('https://alpha.example')
    expect(location.searchParams.get('redirect_uri')).toBe(
      `${ORIGIN}/api/auth/oauth/alpha/callback`,
    )
    const cookie = response.headers.getSetCookie()[0]!
    for (const part of [
      '__Host-oauth=',
      'HttpOnly',
      'Secure',
      'SameSite=Lax',
      'Path=/',
      'Max-Age=600',
    ])
      expect(cookie).toContain(part)
    // Sealed: the state is not readable from the cookie.
    expect(cookie).not.toContain(location.searchParams.get('state')!)
  })

  it('uses the configured origin for the redirect URI', async () => {
    const { get } = setup({ origin: 'https://www.app.example/' })
    const location = new URL((await get('/api/auth/oauth/alpha'))!.headers.get('location')!)
    expect(location.searchParams.get('redirect_uri')).toBe(
      'https://www.app.example/api/auth/oauth/alpha/callback',
    )
  })

  it('signs a new user in without an email, and lands on returnTo', async () => {
    const { signIn, whoIs, get } = setup()
    const { response, session } = await signIn()
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe(`${ORIGIN}/dash`)
    // The state cookie is cleared, the session cookie set.
    expect(response.headers.getSetCookie().some((c) => c.startsWith('__Host-oauth=;'))).toBe(true)
    const user = await whoIs(session)
    expect(user.email).toBeNull()
    expect(await (await get('/api/auth/me', [session!]))!.json()).toEqual({ user })
  })

  it('finds the same user again by provider and subject', async () => {
    const { signIn, whoIs } = setup()
    const first = await whoIs((await signIn()).session)
    const again = await whoIs((await signIn()).session)
    expect(again.id).toBe(first.id)
  })

  it.each([
    ['//evil.example/x', '/'],
    ['/\\evil.example', '/'],
    ['https://evil.example/', '/'],
    ['javascript:alert(1)', '/'],
    ['http://[', '/'],
    ['/billing?plan=pro#top', '/billing?plan=pro#top'],
  ])('sends returnTo %s to %s', async (returnTo, landed) => {
    const { signIn } = setup()
    const { response } = await signIn('alpha', { returnTo })
    expect(response.headers.get('location')).toBe(`${ORIGIN}${landed}`)
  })

  it('joins a verified email to the account that proved it by a sign-in link', async () => {
    const { magic, sent, alpha, signIn, whoIs } = setup()
    const post = (path: string, body: unknown) =>
      magic(
        new Request(`${ORIGIN}/api/auth/${path}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', origin: ORIGIN },
          body: JSON.stringify(body),
        }),
      )
    await post('start', { email: 'ada@example.com' })
    const token = new URL(sent[0]!).searchParams.get('token')
    const linkUser = ((await (await post('verify', { token }))!.json()) as { user: { id: string } })
      .user
    alpha.as({ subject: 'a-1', email: 'ada@example.com' })
    expect((await whoIs((await signIn()).session)).id).toBe(linkUser.id)
  })

  it('never joins accounts on an email the provider did not verify', async () => {
    // The adapter sets Identity.email only when verified; null here stands for unverified.
    const { alpha, beta, signIn, whoIs } = setup()
    alpha.as({ subject: 'a-1', email: 'ada@example.com' })
    const first = await whoIs((await signIn('alpha')).session)
    beta.as({ subject: 'b-1', email: null })
    const second = await whoIs((await signIn('beta')).session)
    expect(second.id).not.toBe(first.id)
  })

  it('links another provider to the signed-in user, and refuses one owned by someone else', async () => {
    const { alpha, beta, signIn, whoIs } = setup()
    alpha.as({ subject: 'a-1' })
    const ada = (await signIn('alpha')).session!
    beta.as({ subject: 'b-1' })
    const linked = await signIn('beta', { cookies: [ada] })
    expect((await whoIs(linked.session)).id).toBe((await whoIs(ada)).id)
    // Grace signs in with alpha; then tries to link Ada's beta identity.
    alpha.as({ subject: 'a-2' })
    const grace = (await signIn('alpha')).session!
    const stolen = await signIn('beta', { cookies: [grace] })
    expect(stolen.session).toBeUndefined()
    expect(stolen.response.headers.get('location')).toBe(`${ORIGIN}/signin?error=identity_in_use`)
  })

  it('refuses a callback without its cookie, with a forged one, or with the wrong state', async () => {
    const { get, signIn, cookieOf } = setup()
    expect(
      (await get('/api/auth/oauth/alpha/callback?state=x&code=c'))!.headers.get('location'),
    ).toBe(`${ORIGIN}/signin?error=expired`)
    const forged = await get('/api/auth/oauth/alpha/callback?state=x&code=c', ['__Host-oauth=AAAA'])
    expect(forged!.headers.get('location')).toBe(`${ORIGIN}/signin?error=state_mismatch`)
    // A real cookie, but another flow's state: login CSRF.
    const start = (await get('/api/auth/oauth/alpha'))!
    const mine = cookieOf(start, '__Host-oauth')!
    const wrong = await get('/api/auth/oauth/alpha/callback?state=theirs&code=c', [mine])
    expect(wrong!.headers.get('location')).toBe(`${ORIGIN}/signin?error=state_mismatch`)
    // A cookie started for alpha, brought back to beta's callback.
    const crossed = await get(
      `/api/auth/oauth/beta/callback?state=${new URL(start.headers.get('location')!).searchParams.get('state')}&code=c`,
      [mine],
    )
    expect(crossed!.headers.get('location')).toBe(`${ORIGIN}/signin?error=state_mismatch`)
    const denied = await signIn('alpha', { query: { error: 'access_denied' } })
    expect(denied.response.headers.get('location')).toBe(`${ORIGIN}/signin?error=denied`)
    expect(denied.session).toBeUndefined()
  })

  it('refuses to run with a short secret, and rejects bad provider ids', async () => {
    const { get } = setup({ secret: 'short' })
    expect((await get('/api/auth/oauth/alpha'))!.status).toBe(500)
    expect(() =>
      handleOAuth(d1(new DatabaseSync(':memory:')), {
        secret: SECRET,
        providers: [scripted('Bad/Id').provider],
      }),
    ).toThrow(/URL segment/)
  })

  it('signs out through the shared route', async () => {
    const { signIn, get, oauth, whoIs } = setup()
    const { session } = await signIn()
    const out = await oauth(
      new Request(`${ORIGIN}/api/auth/signout`, {
        method: 'POST',
        headers: { cookie: session!, origin: ORIGIN },
      }),
    )
    expect(out!.status).toBe(200)
    await expect(whoIs(session)).rejects.toMatchObject({ status: 401 })
    expect(await (await get('/api/auth/me', [session!]))!.json()).toEqual({ user: null })
  })
})

describe('cascivo_auth_0002', () => {
  it('upgrades a database from before it, keeping users, sessions and your own foreign keys', async () => {
    const sqlite = new DatabaseSync(':memory:')
    const db = d1(sqlite)
    // The schema 0001 created, with a user, a session and an app table pointing at users.
    await migrate(db, [
      {
        id: 'cascivo_auth_0001',
        statements: [
          'CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL)',
          'CREATE TABLE auth_links (hash TEXT PRIMARY KEY, email TEXT NOT NULL, expires_at INTEGER NOT NULL)',
          'CREATE TABLE sessions (hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users (id), expires_at INTEGER NOT NULL)',
        ],
      },
    ])
    sqlite.exec(`
      CREATE TABLE todos (id INTEGER PRIMARY KEY, owner TEXT NOT NULL REFERENCES users (id));
      INSERT INTO users VALUES ('u1', 'ada@example.com', '2026-01-01');
      INSERT INTO todos (owner) VALUES ('u1');
    `)
    // The next request after the deploy runs 0002.
    const { signIn, whoIs } = (() => {
      const alpha = scripted('alpha')
      const oauth = handleOAuth(db, { secret: SECRET, providers: [alpha.provider] })
      const get = (path: string, cookies: string[] = []) =>
        oauth(new Request(`${ORIGIN}${path}`, { headers: { cookie: cookies.join('; ') } }))
      return {
        async signIn() {
          const start = (await get('/api/auth/oauth/alpha'))!
          const pending = start.headers.getSetCookie()[0]!.split(';')[0]!
          const state = new URL(start.headers.get('location')!).searchParams.get('state')!
          const response = (await get(`/api/auth/oauth/alpha/callback?state=${state}&code=c`, [
            pending,
          ]))!
          return response.headers
            .getSetCookie()
            .map((c) => c.split(';')[0]!)
            .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
        },
        whoIs: (session: string | undefined) =>
          requireUser(db, new Request(`${ORIGIN}/x`, { headers: { cookie: session ?? '' } })),
      }
    })()
    expect((await whoIs(await signIn())).email).toBeNull()
    expect(sqlite.prepare('SELECT id, email FROM users WHERE id = ?').get('u1')).toMatchObject({
      email: 'ada@example.com',
    })
    // The app's own foreign key still holds after the rebuild.
    expect(() => sqlite.exec("INSERT INTO todos (owner) VALUES ('nobody')")).toThrow(/FOREIGN KEY/)
    expect(sqlite.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  })
})
