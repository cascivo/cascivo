// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { beginAuthorization, completeAuthorization, threads } from './oauth'
import type { TokenSet } from './oauth'
import { PublishError, threadsLength, threadsPublisher } from './social'

const REDIRECT = 'https://app.example/api/connections/threads/callback'
const tokens: TokenSet = { accessToken: 'th-at', refreshToken: null, expiresAt: null, scopes: [] }
const target = { tokens, subject: '1789' }
const png = (alt = 'A chart') => ({ data: new Blob(['png'], { type: 'image/png' }), alt })

interface Call {
  method: string
  url: URL
  form: URLSearchParams | null
  authorization: string | null
}

/** Meta's Threads endpoints, recording each request; `answer` overrides any of them. */
function fakeThreads(answer: (call: Call) => Response | undefined = () => undefined) {
  const calls: Call[] = []
  let containers = 0
  const doFetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input))
    const call: Call = {
      method: init?.method ?? 'GET',
      url,
      form: init?.body instanceof URLSearchParams ? init.body : null,
      authorization: new Headers(init?.headers).get('authorization'),
    }
    calls.push(call)
    const custom = answer(call)
    if (custom) return custom
    const path = url.pathname
    if (path === '/oauth/access_token')
      return Response.json({ access_token: 'short', user_id: 1789 })
    if (path === '/access_token') {
      return Response.json({ access_token: 'long', token_type: 'bearer', expires_in: 5_184_000 })
    }
    if (path === '/refresh_access_token') {
      return Response.json({ access_token: 'renewed', token_type: 'bearer', expires_in: 5_184_000 })
    }
    if (path === '/v1.0/me') {
      return Response.json({
        id: '1789',
        username: 'ada',
        name: 'Ada',
        threads_profile_picture_url: 'https://cdn/x.jpg',
      })
    }
    if (path === '/v1.0/1789/threads') return Response.json({ id: `c${++containers}` })
    if (path === '/v1.0/1789/threads_publish') return Response.json({ id: 'm1' })
    if (path.startsWith('/v1.0/c')) return Response.json({ status: 'FINISHED', id: path.slice(6) })
    if (path === '/v1.0/m1')
      return Response.json({ permalink: 'https://www.threads.com/@ada/post/X' })
    throw new Error(`Unexpected fetch ${url}`)
  }) as typeof fetch
  return { calls, doFetch }
}

describe('threads()', () => {
  it('authorizes without PKCE, then trades the code for a 60-day token', async () => {
    const net = fakeThreads()
    const provider = threads({ clientId: 'app', clientSecret: 'shh', fetch: net.doFetch })
    const { url, pending } = await beginAuthorization(provider, { redirectUri: REDIRECT })
    const authorize = new URL(url)
    expect(authorize.origin + authorize.pathname).toBe('https://www.threads.com/oauth/authorize')
    expect(authorize.searchParams.get('scope')).toBe('threads_basic,threads_content_publish')
    expect(authorize.searchParams.has('code_challenge')).toBe(false)

    const { tokens: granted, identity } = await completeAuthorization(
      provider,
      pending,
      new URLSearchParams({ state: pending.state, code: 'c' }),
    )
    expect(net.calls[0]!.form?.get('client_secret')).toBe('shh')
    expect(net.calls[0]!.form?.get('redirect_uri')).toBe(REDIRECT)
    expect(net.calls[1]!.url.searchParams.get('grant_type')).toBe('th_exchange_token')
    expect(net.calls[1]!.url.searchParams.get('access_token')).toBe('short')
    expect(net.calls[2]!.authorization).toBe('Bearer long')
    expect(granted).toMatchObject({ accessToken: 'long', refreshToken: null })
    expect(granted.expiresAt! - Date.now() / 1000).toBeGreaterThan(59 * 86_400)
    expect(identity).toEqual({
      provider: 'threads',
      subject: '1789',
      email: null,
      name: 'Ada',
      handle: 'ada',
      avatarUrl: 'https://cdn/x.jpg',
    })
    // The token renews itself, in its last 30 days.
    expect(provider.refreshAhead).toBe(30 * 86_400)
  })

  it('renews the long-lived token with itself, and reports Meta’s refusal', async () => {
    const net = fakeThreads()
    const provider = threads({ clientId: 'app', clientSecret: 'shh', fetch: net.doFetch })
    expect(await provider.refresh!({ ...tokens, accessToken: 'long' })).toMatchObject({
      accessToken: 'renewed',
    })
    expect(net.calls[0]!.url.searchParams.get('grant_type')).toBe('th_refresh_token')
    expect(net.calls[0]!.url.searchParams.get('access_token')).toBe('long')

    const refused = fakeThreads(() =>
      Response.json(
        { error: { message: 'Session has expired', type: 'OAuthException', code: 190 } },
        { status: 400 },
      ),
    )
    const expired = threads({ clientId: 'app', clientSecret: 'shh', fetch: refused.doFetch })
    await expect(expired.refresh!(tokens)).rejects.toMatchObject({
      code: 'provider_error',
      message: 'Session has expired',
    })
  })
})

describe('threadsLength', () => {
  it('counts an emoji as its UTF-8 bytes, everything else by character', () => {
    expect(threadsLength('hello')).toBe(5)
    expect(threadsLength('café')).toBe(4)
    expect(threadsLength('😀')).toBe(4)
    expect(threadsLength('🇩🇪')).toBe(8)
    expect(threadsLength('👍🏽 ok')).toBe(11)
  })
})

describe('threadsPublisher', () => {
  it('checks length, images and links before anything is sent', () => {
    const codes = (post: Parameters<ReturnType<typeof threadsPublisher>['check']>[0]) =>
      threadsPublisher({ uploadImage: async () => 'https://x' })
        .check(post)
        .map((p) => p.code)
    expect(codes({ text: 'x'.repeat(500) })).toEqual([])
    expect(codes({ text: 'x'.repeat(500) + '😀' })).toEqual(['too_long'])
    expect(codes({ text: '😀'.repeat(126) })).toEqual(['too_long'])
    expect(codes({ text: '' })).toEqual(['empty'])
    expect(codes({ text: 'x', images: Array.from({ length: 21 }, () => png()) })).toEqual([
      'too_many_images',
    ])
    expect(
      codes({ text: 'x', images: [{ data: new Blob(['x'], { type: 'image/gif' }), alt: 'a' }] }),
    ).toEqual(['bad_image'])
    expect(codes({ text: 'x', images: [png('a'.repeat(1001))] })).toEqual(['bad_image'])
    expect(codes({ text: 'x', link: { url: 'ftp://a', title: 'T' } })).toEqual(['bad_link'])
    expect(
      threadsPublisher()
        .check({ text: 'x', images: [png()] })
        .map((p) => p.code),
    ).toEqual(['bad_image'])
  })

  it('posts text with the link as a card: container, then publish', async () => {
    const net = fakeThreads()
    const posted = await threadsPublisher({ fetch: net.doFetch }).publish(target, {
      text: 'Launch day',
      link: { url: 'https://a.example/post', title: 'Ignored' },
    })
    expect(posted).toEqual({ id: 'm1', url: 'https://www.threads.com/@ada/post/X' })
    expect(net.calls.map((c) => `${c.method} ${c.url.pathname}`)).toEqual([
      'POST /v1.0/1789/threads',
      'POST /v1.0/1789/threads_publish',
      'GET /v1.0/m1',
    ])
    expect(Object.fromEntries(net.calls[0]!.form!)).toEqual({
      media_type: 'TEXT',
      text: 'Launch day',
      link_attachment: 'https://a.example/post',
    })
    expect(net.calls[1]!.form?.get('creation_id')).toBe('c1')
    expect(net.calls[0]!.authorization).toBe('Bearer th-at')
  })

  it('waits for an image Meta is still fetching, with its alt text', async () => {
    let polls = 0
    const net = fakeThreads((call) =>
      call.url.pathname === '/v1.0/c1' && ++polls < 2
        ? Response.json({ status: 'IN_PROGRESS' })
        : undefined,
    )
    await threadsPublisher({
      fetch: net.doFetch,
      pollMs: 1,
      uploadImage: async () => 'https://r2.example/1.png?sig',
    }).publish(target, {
      text: 'One',
      images: [png('First')],
      link: { url: 'https://a.example', title: 'T' },
    })
    expect(Object.fromEntries(net.calls[0]!.form!)).toEqual({
      media_type: 'IMAGE',
      image_url: 'https://r2.example/1.png?sig',
      alt_text: 'First',
      // A post with images carries no card, so the link joins the text.
      text: 'One\n\nhttps://a.example',
    })
    expect(polls).toBe(2)
    expect(net.calls.at(-2)!.url.pathname).toBe('/v1.0/1789/threads_publish')
  })

  it('builds a carousel from several images', async () => {
    const net = fakeThreads()
    let n = 0
    await threadsPublisher({
      fetch: net.doFetch,
      uploadImage: async () => `https://r2.example/${++n}.png`,
    }).publish(target, { text: 'Two', images: [png('A'), png('B')] })
    const created = net.calls.filter((c) => c.url.pathname === '/v1.0/1789/threads')
    expect(created.map((c) => c.form?.get('is_carousel_item'))).toEqual(['true', 'true', null])
    expect(Object.fromEntries(created[2]!.form!)).toEqual({
      media_type: 'CAROUSEL',
      children: 'c1,c2',
      text: 'Two',
    })
    expect(
      net.calls.find((c) => c.url.pathname.endsWith('threads_publish'))!.form?.get('creation_id'),
    ).toBe('c3')
  })

  it('refuses media Meta could not use, without publishing', async () => {
    const net = fakeThreads((call) =>
      call.url.pathname === '/v1.0/c1'
        ? Response.json({ status: 'ERROR', error_message: 'INVALID_ASPEC_RATIO' })
        : undefined,
    )
    const error = await threadsPublisher({
      fetch: net.doFetch,
      uploadImage: async () => 'https://x',
    })
      .publish(target, { text: 'x', images: [png()] })
      .catch((e: unknown) => e)
    expect(error).toMatchObject({
      kind: 'invalid',
      message: expect.stringContaining('INVALID_ASPEC_RATIO'),
    })
    expect(net.calls.some((c) => c.url.pathname.endsWith('threads_publish'))).toBe(false)
  })

  it.each([
    [400, { code: 190, message: 'Invalid OAuth access token' }, 'reconnect', false],
    [400, { code: 10, message: 'Permission denied' }, 'reconnect', false],
    [400, { code: 4, message: 'Application request limit reached' }, 'rate_limited', true],
    [400, { code: 100, message: 'Invalid parameter' }, 'invalid', false],
    [500, { code: 2, message: 'Service unavailable', is_transient: true }, 'failed', true],
  ] as const)('reports a %i with code %o as %s', async (status, error, kind, retryable) => {
    const net = fakeThreads(() => Response.json({ error }, { status }))
    const thrown = await threadsPublisher({ fetch: net.doFetch })
      .publish(target, { text: 'Hi' })
      .catch((e: unknown) => e)
    expect(thrown).toBeInstanceOf(PublishError)
    expect(thrown).toMatchObject({
      network: 'threads',
      kind,
      status,
      message: error.message,
      retryable,
    })
  })

  it('still reports the post when its address cannot be read', async () => {
    const net = fakeThreads((call) =>
      call.url.pathname === '/v1.0/m1' ? new Response('', { status: 500 }) : undefined,
    )
    expect(await threadsPublisher({ fetch: net.doFetch }).publish(target, { text: 'Hi' })).toEqual({
      id: 'm1',
      url: null,
    })
  })
})
