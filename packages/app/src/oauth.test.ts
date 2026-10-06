// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import {
  beginAuthorization,
  completeAuthorization,
  github,
  google,
  linkedin,
  OAuthError,
  parsePendingAuthorization,
  renewalDue,
  seal,
  unseal,
} from './oauth'
import type { OAuthProvider, PendingAuthorization } from './oauth'
import { rsaIssuer } from './sqlite.fixtures'

const REDIRECT = 'https://app.example/api/auth/oauth/x/callback'
const SECRET = 'a-test-secret-that-is-long-enough-0123'

type Handler = (url: URL, init: RequestInit | undefined) => Response | Promise<Response>

/** A fetch that answers by URL prefix and records what it was asked. */
function fakeFetch(routes: Record<string, Handler>) {
  const calls: { url: string; init: RequestInit | undefined }[] = []
  const doFetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
    )
    calls.push({ url: url.href, init })
    const key = Object.keys(routes).find((prefix) => url.href.startsWith(prefix))
    if (!key) throw new Error(`Unexpected fetch: ${url.href}`)
    return routes[key]!(url, init)
  }) as typeof fetch
  return { doFetch, calls }
}

const form = (init: RequestInit | undefined) => new URLSearchParams(String(init?.body))

async function begin(provider: OAuthProvider) {
  const { url, pending } = await beginAuthorization(provider, { redirectUri: REDIRECT })
  return { url: new URL(url), pending }
}

const callback = (pending: PendingAuthorization, extra: Record<string, string> = {}) =>
  new URLSearchParams({ state: pending.state, code: 'the-code', ...extra })

describe('beginAuthorization / completeAuthorization', () => {
  const provider = github({ clientId: 'gh-id', clientSecret: 'gh-secret' })

  it('sends state and an S256 challenge of the verifier it keeps', async () => {
    const { url, pending } = await begin(provider)
    expect(url.origin + url.pathname).toBe('https://github.com/login/oauth/authorize')
    expect(url.searchParams.get('state')).toBe(pending.state)
    expect(url.searchParams.get('redirect_uri')).toBe(REDIRECT)
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(pending.codeVerifier),
    )
    expect(url.searchParams.get('code_challenge')).toBe(Buffer.from(digest).toString('base64url'))
    // PKCE wants 43–128 unreserved characters.
    expect(pending.codeVerifier).toMatch(/^[\w-]{43,128}$/)
    const again = await begin(provider)
    expect(again.pending.state).not.toBe(pending.state)
  })

  it('refuses a callback for another flow, another provider, or a stale one', async () => {
    const { pending } = await begin(provider)
    const code = (p: Promise<unknown>) =>
      p.then(
        () => 'resolved',
        (error: unknown) => (error instanceof OAuthError ? error.code : String(error)),
      )
    expect(
      await code(completeAuthorization(provider, pending, callback(pending, { state: 'x' }))),
    ).toBe('state_mismatch')
    expect(
      await code(completeAuthorization(provider, pending, new URLSearchParams({ code: 'c' }))),
    ).toBe('state_mismatch')
    const other = google({ clientId: 'g', clientSecret: 's' })
    expect(await code(completeAuthorization(other, pending, callback(pending)))).toBe(
      'state_mismatch',
    )
    expect(
      await code(completeAuthorization(provider, { ...pending, expiresAt: 0 }, callback(pending))),
    ).toBe('expired')
    expect(
      await code(
        completeAuthorization(provider, pending, callback(pending, { error: 'access_denied' })),
      ),
    ).toBe('denied')
  })

  it('parses a stored pending authorization, and refuses a malformed one', async () => {
    const { pending } = await begin(provider)
    expect(parsePendingAuthorization(JSON.parse(JSON.stringify(pending)))).toEqual(pending)
    expect(() => parsePendingAuthorization({ ...pending, scopes: [1] })).toThrow(/Malformed/)
    expect(() => parsePendingAuthorization(null)).toThrow(/Malformed/)
  })
})

describe('seal / unseal', () => {
  it('round-trips, and opens only under the same secret and context', async () => {
    const sealed = await seal(SECRET, 'ctx', { a: 1 })
    expect(await unseal(SECRET, 'ctx', sealed)).toEqual({ a: 1 })
    expect(await unseal(SECRET, 'other', sealed)).toBeNull()
    expect(await unseal(`${SECRET}!`, 'ctx', sealed)).toBeNull()
    const flipped = `${sealed.slice(0, 20)}${sealed[20] === 'A' ? 'B' : 'A'}${sealed.slice(21)}`
    expect(await unseal(SECRET, 'ctx', flipped)).toBeNull()
    expect(await unseal(SECRET, 'ctx', 'not sealed')).toBeNull()
  })

  it('refuses a short secret', async () => {
    await expect(seal('short', 'ctx', 1)).rejects.toThrow(/at least 32/)
  })
})

describe('google', () => {
  let issuer: Awaited<ReturnType<typeof rsaIssuer>>
  beforeAll(async () => {
    issuer = await rsaIssuer('google-test-key')
  })

  function setup(claims: (pending: PendingAuthorization) => Record<string, unknown>, options = {}) {
    let current: PendingAuthorization | undefined
    const { doFetch, calls } = fakeFetch({
      'https://oauth2.googleapis.com/token': async (_url, init) => {
        const body = form(init)
        if (body.get('grant_type') === 'refresh_token') {
          return Response.json({ access_token: 'at-2', expires_in: 3600, scope: 'openid email' })
        }
        return Response.json({
          access_token: 'at-1',
          expires_in: 3600,
          scope: 'openid email profile',
          id_token: await issuer.sign(claims(current!)),
        })
      },
      'https://www.googleapis.com/oauth2/v3/certs': () => Response.json(issuer.jwks),
    })
    const provider = google({
      clientId: 'g-id',
      clientSecret: 'g-secret',
      fetch: doFetch,
      ...options,
    })
    return {
      calls,
      provider,
      async run() {
        const { pending } = await begin(provider)
        current = pending
        return completeAuthorization(provider, pending, callback(pending))
      },
    }
  }

  const valid = (pending: PendingAuthorization) => ({
    iss: 'https://accounts.google.com',
    aud: 'g-id',
    sub: '1234',
    exp: Math.floor(Date.now() / 1000) + 600,
    nonce: pending.nonce,
    email: 'Ada@Example.com',
    email_verified: true,
    name: 'Ada',
    picture: 'https://pics.example/ada.png',
  })

  it('verifies the ID token and returns a verified, lowercased email', async () => {
    const { run, calls } = setup(valid)
    const { identity, tokens } = await run()
    expect(identity).toEqual({
      provider: 'google',
      subject: '1234',
      email: 'ada@example.com',
      name: 'Ada',
      handle: null,
      avatarUrl: 'https://pics.example/ada.png',
    })
    expect(tokens).toMatchObject({ accessToken: 'at-1', refreshToken: null })
    expect(tokens.scopes).toEqual(['openid', 'email', 'profile'])
    const exchange = form(calls[0]!.init)
    expect(exchange.get('code')).toBe('the-code')
    expect(exchange.get('code_verifier')).toBeTruthy()
    expect(exchange.get('redirect_uri')).toBe(REDIRECT)
  })

  it('drops an email Google has not verified', async () => {
    const { run } = setup((p) => ({ ...valid(p), email_verified: false }))
    expect((await run()).identity.email).toBeNull()
  })

  it.each([
    ['wrong nonce', (p: PendingAuthorization) => ({ ...valid(p), nonce: 'other' })],
    ['wrong audience', (p: PendingAuthorization) => ({ ...valid(p), aud: 'someone-else' })],
    ['wrong issuer', (p: PendingAuthorization) => ({ ...valid(p), iss: 'https://evil.example' })],
    ['token expired', (p: PendingAuthorization) => ({ ...valid(p), exp: 1 })],
  ])('refuses an ID token with %s', async (reason, claims) => {
    const { run } = setup(claims)
    await expect(run()).rejects.toThrow(new RegExp(reason))
  })

  it('holds a Workspace domain on the token, not only on the URL', async () => {
    const { provider, run } = setup((p) => ({ ...valid(p), hd: 'other.com' }), {
      hostedDomain: 'acme.com',
    })
    const { url } = await begin(provider)
    expect(url.searchParams.get('hd')).toBe('acme.com')
    await expect(run()).rejects.toMatchObject({ code: 'denied' })
  })

  it('asks for offline access only when told to, and keeps the refresh token on refresh', async () => {
    const plain = setup(valid)
    expect((await begin(plain.provider)).url.searchParams.get('access_type')).toBeNull()
    const offline = setup(valid, { offline: true })
    const { url } = await begin(offline.provider)
    expect(url.searchParams.get('access_type')).toBe('offline')
    const refreshed = await offline.provider.refresh!({
      accessToken: 'at-1',
      refreshToken: 'rt-1',
      expiresAt: 0,
      scopes: ['openid'],
    })
    expect(refreshed).toMatchObject({ accessToken: 'at-2', refreshToken: 'rt-1' })
  })
})

describe('linkedin', () => {
  let issuer: Awaited<ReturnType<typeof rsaIssuer>>
  beforeAll(async () => {
    issuer = await rsaIssuer('linkedin-test-key')
  })

  function setup(claims: (pending: PendingAuthorization) => Record<string, unknown>) {
    let current: PendingAuthorization | undefined
    const { doFetch, calls } = fakeFetch({
      'https://www.linkedin.com/oauth/v2/accessToken': async () =>
        Response.json({
          access_token: 'li-1',
          expires_in: 5184000,
          scope: 'email,openid,profile,w_member_social',
          id_token: await issuer.sign(claims(current!)),
        }),
      'https://www.linkedin.com/oauth/openid/jwks': () => Response.json(issuer.jwks),
    })
    const provider = linkedin({ clientId: 'li-id', clientSecret: 'li-secret', fetch: doFetch })
    return {
      calls,
      provider,
      async run() {
        const { pending } = await begin(provider)
        current = pending
        return completeAuthorization(provider, pending, callback(pending))
      },
    }
  }

  const valid = () => ({
    iss: 'https://www.linkedin.com/oauth',
    aud: 'li-id',
    sub: 'abc-pairwise',
    exp: Math.floor(Date.now() / 1000) + 600,
    email: 'Ada@Example.com',
    email_verified: true,
    name: 'Ada Lovelace',
  })

  it('verifies the ID token without a nonce, and reads the 60-day token', async () => {
    const { run, calls } = setup(valid)
    const { identity, tokens } = await run()
    expect(identity).toMatchObject({
      provider: 'linkedin',
      subject: 'abc-pairwise',
      email: 'ada@example.com',
    })
    expect(tokens.scopes).toEqual(['email', 'openid', 'profile', 'w_member_social'])
    expect(tokens.expiresAt).toBeGreaterThan(Date.now() / 1000 + 5_000_000)
    // A web app authenticates with its secret: no PKCE verifier is sent.
    const exchange = form(calls[0]!.init)
    expect(exchange.get('client_secret')).toBe('li-secret')
    expect(exchange.has('code_verifier')).toBe(false)
  })

  it('sends no PKCE challenge, and accepts the issuer as the docs page spells it', async () => {
    const { provider, run } = setup(() => ({ ...valid(), iss: 'https://www.linkedin.com' }))
    const { url } = await begin(provider)
    expect(url.searchParams.has('code_challenge')).toBe(false)
    expect((await run()).identity.subject).toBe('abc-pairwise')
  })

  it('refuses a nonce that does not match, and an unverified email', async () => {
    await expect(setup(() => ({ ...valid(), nonce: 'other' })).run()).rejects.toThrow(/wrong nonce/)
    const unverified = setup(() => ({ ...valid(), email_verified: false }))
    expect((await unverified.run()).identity.email).toBeNull()
  })
})

describe('github', () => {
  function setup(
    emails: unknown,
    token: Record<string, unknown> = { access_token: 'gho_1', scope: 'read:user,user:email' },
  ) {
    const { doFetch, calls } = fakeFetch({
      'https://github.com/login/oauth/access_token': () => Response.json(token),
      'https://api.github.com/user/emails': () =>
        emails === 403 ? new Response('{}', { status: 403 }) : Response.json(emails),
      'https://api.github.com/user': () =>
        Response.json({ id: 42, login: 'ada', name: 'Ada', avatar_url: 'https://a.example/1' }),
    })
    const provider = github({ clientId: 'gh-id', clientSecret: 'gh-secret', fetch: doFetch })
    return {
      calls,
      async run() {
        const { pending } = await begin(provider)
        return completeAuthorization(provider, pending, callback(pending))
      },
    }
  }

  it('takes the numeric id and only the primary, verified email', async () => {
    const { run, calls } = setup([
      { email: 'old@example.com', primary: false, verified: true },
      { email: 'Ada@Example.com', primary: true, verified: true },
    ])
    const { identity, tokens } = await run()
    expect(identity).toEqual({
      provider: 'github',
      subject: '42',
      email: 'ada@example.com',
      name: 'Ada',
      handle: 'ada',
      avatarUrl: 'https://a.example/1',
    })
    expect(tokens).toEqual({
      accessToken: 'gho_1',
      refreshToken: null,
      expiresAt: null,
      scopes: ['read:user', 'user:email'],
    })
    // GitHub's API refuses a request without a User-Agent.
    const apiCall = calls.find((c) => c.url === 'https://api.github.com/user')!
    expect(new Headers(apiCall.init?.headers).get('user-agent')).toBe('cascivo-app')
    expect(new Headers(apiCall.init?.headers).get('authorization')).toBe('Bearer gho_1')
  })

  it('has no email when the primary one is unverified, or emails cannot be read', async () => {
    const unverified = setup([{ email: 'ada@example.com', primary: true, verified: false }])
    expect((await unverified.run()).identity.email).toBeNull()
    const noScope = setup(403)
    expect((await noScope.run()).identity.email).toBeNull()
  })

  it('reports the error GitHub sends with a 200', async () => {
    const { run } = setup([], {
      error: 'bad_verification_code',
      error_description: 'The code passed is incorrect or expired.',
    })
    await expect(run()).rejects.toMatchObject({
      code: 'provider_error',
      message: 'The code passed is incorrect or expired.',
    })
  })
})

describe('renewalDue', () => {
  const DAY = 86_400
  const now = 1_000_000_000
  const tokens = (expiresIn: number | null, refreshToken: string | null = null) => ({
    accessToken: 'a',
    refreshToken,
    expiresAt: expiresIn === null ? null : now + expiresIn,
    scopes: [],
  })
  const refresh = async () => tokens(3600)

  it('renews a refresh-token provider when the token is about to expire, or has', () => {
    const provider = { refresh }
    expect(renewalDue(provider, tokens(3600, 'r'), { now })).toBe('no')
    expect(renewalDue(provider, tokens(30, 'r'), { now })).toBe('soon')
    expect(renewalDue(provider, tokens(-30, 'r'), { now })).toBe('soon')
    expect(renewalDue(provider, tokens(null, 'r'), { now })).toBe('no')
  })

  it('renews a self-renewing token inside its window, while it still works', () => {
    const provider = { refresh, refreshAhead: 30 * DAY }
    expect(renewalDue(provider, tokens(40 * DAY), { now })).toBe('no')
    expect(renewalDue(provider, tokens(20 * DAY), { now })).toBe('soon')
    expect(renewalDue(provider, tokens(-1), { now })).toBe('cannot')
  })

  it('warns ahead of a token nothing can renew', () => {
    const provider = {}
    expect(renewalDue(provider, tokens(10 * DAY), { now })).toBe('no')
    expect(renewalDue(provider, tokens(3 * DAY), { now })).toBe('cannot')
    expect(renewalDue(provider, tokens(10 * DAY), { now, warnSeconds: 14 * DAY })).toBe('cannot')
  })
})

describe('boundary', () => {
  it('imports nothing of the app layer: no database, cookies or users', async () => {
    const { readFileSync } = await import('node:fs')
    const source = readFileSync(new URL('./oauth.ts', import.meta.url), 'utf8')
    const imports = [...source.matchAll(/^import[^'"]*['"]([^'"]+)['"]/gm)].map((m) => m[1])
    // Usable from any runtime with fetch and WebCrypto, so other code can reuse the adapters.
    expect(imports).toEqual(['./dpop', './jwt'])
    // And those two are crypto only.
    const dpop = readFileSync(new URL('./dpop.ts', import.meta.url), 'utf8')
    expect([...dpop.matchAll(/^import[^'"]*['"]([^'"]+)['"]/gm)].map((m) => m[1])).toEqual([
      './jwt',
    ])
  })
})
