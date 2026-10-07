// @vitest-environment node
import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import { SESSION_COOKIE } from './auth-server'
import { mastodon, normalizeServer, OAuthError } from './oauth'
import type { MastodonRegistration, MastodonRegistrations, OAuthProvider } from './oauth'
import {
  connectionTokens,
  handleConnections,
  handleOAuth,
  listConnections,
  mastodonRegistrations,
} from './oauth-server'
import { mastodonLength, mastodonPublisher, mastodonServerLimits } from './social'
import { d1 } from './sqlite.fixtures'

const ORIGIN = 'https://app.example'
const SECRET = 'a-test-secret-that-is-long-enough-0123'
const REDIRECT = `${ORIGIN}/api/connections/mastodon/callback`

function memory(): MastodonRegistrations & { size: () => number } {
  const map = new Map<string, MastodonRegistration>()
  return {
    get: async (key) => map.get(key) ?? null,
    set: async (key, value) => void map.set(key, value),
    size: () => map.size,
  }
}

interface ServerShape {
  /** Mastodon 4.3+: metadata with PKCE and the profile scope. */
  modern?: boolean
  /** A metadata document that sends the token elsewhere. */
  hostileTokenEndpoint?: boolean
}

/** One Mastodon server, as far as OAuth and posting go. */
function fakeServer(host: string, shape: ServerShape = { modern: true }) {
  const calls: { url: string; method: string; body: unknown; headers: Headers }[] = []
  let mediaPolls = 0
  const doFetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input))
    const raw = init?.body
    const body =
      typeof raw === 'string'
        ? (() => {
            try {
              return JSON.parse(raw) as unknown
            } catch {
              return raw
            }
          })()
        : raw instanceof URLSearchParams
          ? Object.fromEntries(raw)
          : raw
    calls.push({
      url: url.href,
      method: init?.method ?? 'GET',
      body,
      headers: new Headers(init?.headers),
    })
    if (url.host !== host) throw new Error(`Unexpected host ${url.host}`)
    switch (url.pathname) {
      case '/.well-known/oauth-authorization-server':
        if (!shape.modern) return new Response('Not found', { status: 404 })
        return Response.json({
          issuer: `https://${host}/`,
          authorization_endpoint: `https://${host}/oauth/authorize`,
          token_endpoint: shape.hostileTokenEndpoint
            ? 'https://collector.example/token'
            : `https://${host}/oauth/token`,
          scopes_supported: ['read', 'write', 'profile', 'write:statuses', 'write:media'],
          code_challenge_methods_supported: ['S256'],
        })
      case '/api/v1/apps':
        return Response.json({ client_id: 'cid', client_secret: 'csecret' })
      case '/oauth/token':
        return Response.json({
          access_token: 'm-token',
          token_type: 'Bearer',
          scope: 'profile write:statuses',
        })
      case '/api/v1/accounts/verify_credentials':
        return Response.json({
          id: '109',
          username: 'ada',
          display_name: 'Ada',
          avatar: 'https://x/a.png',
        })
      case '/api/v2/media':
        return Response.json({ id: 'media-1', url: null }, { status: 202 })
      case '/api/v1/media/media-1':
        mediaPolls += 1
        return Response.json({ id: 'media-1', url: 'https://x/m.png' }, { status: 200 })
      case '/api/v1/statuses':
        return Response.json({ id: 's-1', url: `https://${host}/@ada/s-1` })
    }
    throw new Error(`Unexpected path ${url.pathname}`)
  }) as typeof fetch
  return { doFetch, calls, mediaPolls: () => mediaPolls }
}

describe('normalizeServer', () => {
  it.each([
    ['mastodon.social', 'mastodon.social'],
    ['  Mastodon.Social  ', 'mastodon.social'],
    ['https://mastodon.social/about', 'mastodon.social'],
    ['@ada@hachyderm.io', 'hachyderm.io'],
    ['ada@social.example.org', 'social.example.org'],
    ['bücher.example', 'xn--bcher-kva.example'],
    // Everything before the last @ is a handle's username: credentials cannot reach the URL.
    ['user:pass@mastodon.social', 'mastodon.social'],
    ['https://user:pw@mastodon.social', 'mastodon.social'],
  ])('reads %j as %j', (input, host) => {
    expect(normalizeServer(input)).toBe(host)
  })

  it.each([
    '',
    'localhost',
    'intranet',
    '127.0.0.1',
    '10.0.0.5',
    '[::1]',
    'mastodon.social:8443',
    'printer.local',
    'db.internal',
    'x'.repeat(260),
  ])('refuses %j', (input) => {
    expect(() => normalizeServer(input)).toThrow(OAuthError)
  })
})

describe('mastodon()', () => {
  const provider = (
    server: ReturnType<typeof fakeServer>,
    registrations = memory(),
    scopes?: string[],
  ) =>
    mastodon({
      appName: 'Edge App',
      website: ORIGIN,
      registrations,
      fetch: server.doFetch,
      ...(scopes ? { scopes } : {}),
    })

  it('registers once per server, with PKCE and the profile scope on 4.3+', async () => {
    const server = fakeServer('social.example')
    const registrations = memory()
    const forServer = provider(server, registrations, ['profile', 'write:statuses']).forServer!
    const one = await forServer('Social.Example', REDIRECT)
    await forServer('social.example', REDIRECT)
    expect(server.calls.filter((c) => c.url.endsWith('/api/v1/apps'))).toHaveLength(1)
    expect(registrations.size()).toBe(1)
    expect(server.calls.find((c) => c.url.endsWith('/api/v1/apps'))!.body).toMatchObject({
      client_name: 'Edge App',
      redirect_uris: REDIRECT,
      scopes: 'profile write:statuses',
    })
    const url = await one.authorizationUrl(
      {
        provider: 'mastodon',
        state: 's',
        codeVerifier: 'v',
        nonce: 'n',
        redirectUri: REDIRECT,
        scopes: [],
        expiresAt: 0,
        server: 'social.example',
        dpopKey: null,
      },
      'challenge',
    )
    expect(url.origin).toBe('https://social.example')
    expect(url.searchParams.get('code_challenge')).toBe('challenge')
    expect(url.searchParams.get('scope')).toBe('profile write:statuses')
  })

  it('falls back to read:accounts and no PKCE on a server without metadata', async () => {
    const server = fakeServer('old.example', { modern: false })
    const resolved = await provider(server).forServer!('old.example', REDIRECT)
    expect(resolved.scopes).toEqual(['read:accounts'])
    const url = await resolved.authorizationUrl(
      {
        provider: 'mastodon',
        state: 's',
        codeVerifier: 'v',
        nonce: 'n',
        redirectUri: REDIRECT,
        scopes: [],
        expiresAt: 0,
        server: 'old.example',
        dpopKey: null,
      },
      'challenge',
    )
    expect(url.pathname).toBe('/oauth/authorize')
    expect(url.searchParams.has('code_challenge')).toBe(false)
  })

  it('refuses a server whose metadata sends the token to another host', async () => {
    const server = fakeServer('evil.example', { modern: true, hostileTokenEndpoint: true })
    await expect(provider(server).forServer!('evil.example', REDIRECT)).rejects.toMatchObject({
      code: 'bad_server',
    })
  })

  it('stops reading a server that sends too much', async () => {
    const huge = (async () => new Response('x'.repeat(300 * 1024), { status: 200 })) as typeof fetch
    const m = mastodon({ appName: 'A', registrations: memory(), fetch: huge })
    await expect(m.forServer!('big.example', REDIRECT)).rejects.toMatchObject({
      code: 'bad_server',
      message: expect.stringMatching(/too much/),
    })
  })

  it('names the account by id and server, with no email', async () => {
    const server = fakeServer('social.example')
    const resolved = await provider(server).forServer!('social.example', REDIRECT)
    const { identity, tokens } = await resolved.exchange('code', {
      provider: 'mastodon',
      state: 's',
      codeVerifier: 'verifier',
      nonce: 'n',
      redirectUri: REDIRECT,
      scopes: [],
      expiresAt: 0,
      server: 'social.example',
      dpopKey: null,
    })
    expect(identity).toEqual({
      provider: 'mastodon',
      subject: '109@social.example',
      email: null,
      name: 'Ada',
      handle: '@ada@social.example',
      avatarUrl: 'https://x/a.png',
      server: 'social.example',
    })
    expect(tokens.expiresAt).toBeNull()
    const exchange = server.calls.find((c) => c.url.endsWith('/oauth/token'))!
    expect(exchange.body).toMatchObject({ code_verifier: 'verifier', client_secret: 'csecret' })
  })
})

describe('connecting a Mastodon account', () => {
  it('goes to the server the user named, and keeps the server with the connection', async () => {
    const sqlite = new DatabaseSync(':memory:')
    const db = d1(sqlite)
    const server = fakeServer('social.example')
    const login: OAuthProvider = {
      id: 'login',
      scopes: [],
      authorizationUrl: (p) => new URL(`https://login.example/?state=${p.state}`),
      exchange: async () => ({
        tokens: { accessToken: 't', refreshToken: null, expiresAt: null, scopes: [] },
        identity: {
          provider: 'login',
          subject: 'u',
          email: null,
          name: null,
          handle: null,
          avatarUrl: null,
        },
      }),
    }
    const signIn = handleOAuth(db, { secret: SECRET, providers: [login] })
    const m = mastodon({
      appName: 'Edge App',
      scopes: ['profile', 'write:statuses'],
      registrations: mastodonRegistrations(db, SECRET),
      fetch: server.doFetch,
    })
    const connections = handleConnections(db, { secret: SECRET, providers: [m] })
    const cookieOf = (r: Response, name: string) =>
      r.headers
        .getSetCookie()
        .map((c) => c.split(';')[0]!)
        .find((c) => c.startsWith(`${name}=`))
    const get = (h: typeof signIn, path: string, cookies: string[]) =>
      h(new Request(`${ORIGIN}${path}`, { headers: { cookie: cookies.join('; ') } }))

    const start = (await get(signIn, '/api/auth/oauth/login', []))!
    const state = new URL(start.headers.get('location')!).searchParams.get('state')
    const signedIn = (await get(signIn, `/api/auth/oauth/login/callback?state=${state}&code=c`, [
      cookieOf(start, '__Host-oauth')!,
    ]))!
    const session = cookieOf(signedIn, SESSION_COOKIE)!

    // No server named: refused before anything is fetched.
    const unnamed = (await get(connections, '/api/connections/mastodon', [session]))!
    expect(unnamed.headers.get('location')).toBe(`${ORIGIN}/settings?error=bad_server`)
    expect(server.calls).toHaveLength(0)

    const go = (await get(connections, '/api/connections/mastodon?server=@ada@social.example', [
      session,
    ]))!
    const location = new URL(go.headers.get('location')!)
    expect(location.origin).toBe('https://social.example')
    expect(location.searchParams.get('redirect_uri')).toBe(REDIRECT)
    const back = (await get(
      connections,
      `/api/connections/mastodon/callback?state=${location.searchParams.get('state')}&code=c`,
      [session, cookieOf(go, '__Host-connect')!],
    ))!
    expect(back.headers.get('location')).toBe(`${ORIGIN}/`)

    const me = (await (await get(signIn, '/api/auth/me', [session]))!.json()) as {
      user: { id: string }
    }
    const [connection] = await listConnections(db, me.user.id)
    expect(connection).toMatchObject({
      provider: 'mastodon',
      subject: '109@social.example',
      server: 'social.example',
      handle: '@ada@social.example',
    })
    const { tokens } = await connectionTokens(
      db,
      { secret: SECRET, providers: [m] },
      { connectionId: connection!.id, userId: me.user.id },
    )
    expect(tokens.accessToken).toBe('m-token')
    // The registration is stored sealed, not in the clear.
    expect(JSON.stringify(sqlite.prepare('SELECT * FROM oauth_clients').all())).not.toContain(
      'csecret',
    )
  })
})

describe('mastodonServerLimits', () => {
  const answering = (status: number, body: unknown) => {
    const urls: string[] = []
    const doFetch = (async (input: string | URL | Request, init?: RequestInit) => {
      urls.push(String(input))
      expect(init?.redirect).toBe('manual')
      return Response.json(body, { status })
    }) as typeof fetch
    return { urls, doFetch }
  }

  it('reads the server’s own limits, and the publisher checks against them', async () => {
    const net = answering(200, {
      configuration: {
        statuses: {
          max_characters: 11_000,
          max_media_attachments: 8,
          characters_reserved_per_url: 30,
        },
      },
    })
    const limits = await mastodonServerLimits('hachyderm.io', { fetch: net.doFetch })
    expect(net.urls).toEqual(['https://hachyderm.io/api/v2/instance'])
    expect(limits).toEqual({ maxChars: 11_000, maxImages: 8, urlWeight: 30 })
    const publisher = mastodonPublisher(limits)
    expect(publisher.check({ text: 'x'.repeat(11_000) })).toEqual([])
    expect(publisher.check({ text: 'x'.repeat(11_001) }).map((p) => p.code)).toEqual(['too_long'])
    expect(mastodonLength('https://a.example/long', limits.urlWeight)).toBe(30)
  })

  it.each([
    ['an error', 503, {}],
    ['no configuration', 200, { version: '4.3.0' }],
    [
      'figures out of reason',
      200,
      { configuration: { statuses: { max_characters: -1, max_media_attachments: 1e9 } } },
    ],
  ])('falls back to Mastodon’s defaults on %s', async (_, status, body) => {
    expect(
      await mastodonServerLimits('a.example', { fetch: answering(status, body).doFetch }),
    ).toEqual({
      maxChars: 500,
      maxImages: 4,
      urlWeight: 23,
    })
  })
})

describe('mastodonPublisher', () => {
  const tokens = { accessToken: 'm-token', refreshToken: null, expiresAt: null, scopes: [] }

  it('counts as Mastodon does: URLs as 23, mentions without their server', () => {
    expect(mastodonLength(`Read https://example.com/${'a'.repeat(200)}`)).toBe(5 + 23)
    expect(mastodonLength('Hi @ada@social.example!')).toBe('Hi @ada!'.length)
    expect(mastodonLength('😀😀')).toBe(2)
    const publisher = mastodonPublisher({ maxChars: 30 })
    expect(publisher.check({ text: `Short https://example.com/${'a'.repeat(500)}` })).toEqual([])
    expect(publisher.check({ text: 'x'.repeat(31) }).map((p) => p.code)).toEqual(['too_long'])
    expect(
      publisher.check({
        text: 'x',
        images: [{ data: new Blob(['x'], { type: 'image/webp' }), alt: 'w' }],
      }),
    ).toEqual([])
  })

  it('appends the link, waits for an image to process, and sends the idempotency key', async () => {
    const server = fakeServer('social.example')
    const publisher = mastodonPublisher({ fetch: server.doFetch })
    const posted = await publisher.publish(
      { tokens, subject: '109@social.example', server: 'social.example' },
      {
        text: 'New post',
        link: { url: 'https://blog.example/1', title: 'ignored: the server builds the card' },
        images: [{ data: new Blob(['png'], { type: 'image/png' }), alt: 'A chart' }],
      },
      { idempotencyKey: 'post-7:mastodon' },
    )
    expect(posted).toEqual({ id: 's-1', url: 'https://social.example/@ada/s-1' })
    expect(server.mediaPolls()).toBe(1)
    const status = server.calls.find((c) => c.url.endsWith('/api/v1/statuses'))!
    expect(status.body).toEqual({
      status: 'New post\n\nhttps://blog.example/1',
      media_ids: ['media-1'],
      visibility: 'public',
    })
    expect(status.headers.get('idempotency-key')).toBe('post-7:mastodon')
    expect(status.headers.get('authorization')).toBe('Bearer m-token')
  })

  it('needs the server', async () => {
    await expect(
      mastodonPublisher().publish({ tokens, subject: '1@x.example' }, { text: 'Hi' }),
    ).rejects.toMatchObject({ kind: 'invalid' })
  })
})
