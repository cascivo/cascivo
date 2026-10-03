// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { beginAuthorization, buffer, completeAuthorization } from './oauth'
import type { TokenSet } from './oauth'
import { bufferChannels, bufferPublisher, bufferTokens, PublishError } from './social'

const REDIRECT = 'https://app.example/api/connections/buffer/callback'
const tokens: TokenSet = bufferTokens('key-1')

interface GraphQLCall {
  query: string
  authorization: string | null
}

/** Buffer's token endpoint and GraphQL API, answering what each test sets. */
function fakeBuffer(answer: (query: string) => Response = () => Response.json({ data: {} })) {
  const forms: URLSearchParams[] = []
  const queries: GraphQLCall[] = []
  let refresh = 'rt-1'
  const doFetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    if (url === 'https://auth.buffer.com/token') {
      const form = new URLSearchParams(String(init?.body))
      forms.push(form)
      if (form.get('grant_type') === 'refresh_token') {
        if (form.get('refresh_token') !== refresh)
          return Response.json({ error: 'invalid_grant' }, { status: 400 })
        refresh = 'rt-2'
      }
      return Response.json({
        access_token: `at-${refresh}`,
        refresh_token: refresh,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'posts:write posts:read account:read offline_access',
      })
    }
    if (url === 'https://api.buffer.com') {
      const { query } = JSON.parse(String(init?.body)) as { query: string }
      queries.push({ query, authorization: new Headers(init?.headers).get('authorization') })
      if (query.includes('organizations')) {
        return Response.json({
          data: { account: { organizations: [{ id: 'org-1', name: 'Acme' }] } },
        })
      }
      return answer(query)
    }
    throw new Error(`Unexpected fetch ${url}`)
  }) as typeof fetch
  return { doFetch, forms, queries }
}

describe('buffer()', () => {
  it('authorizes with PKCE, consent and offline access, and names the organization', async () => {
    const net = fakeBuffer()
    const provider = buffer({ clientId: 'c1', clientSecret: 's1', fetch: net.doFetch })
    const { url, pending } = await beginAuthorization(provider, { redirectUri: REDIRECT })
    const params = new URL(url).searchParams
    expect(new URL(url).origin + new URL(url).pathname).toBe('https://auth.buffer.com/auth')
    expect(params.get('code_challenge_method')).toBe('S256')
    expect(params.get('prompt')).toBe('consent')
    expect(params.get('scope')).toContain('offline_access')
    const { tokens: granted, identity } = await completeAuthorization(
      provider,
      pending,
      new URLSearchParams({ state: pending.state, code: 'c' }),
    )
    expect(net.forms[0]!.get('code_verifier')).toBe(pending.codeVerifier)
    expect(net.forms[0]!.get('client_secret')).toBe('s1')
    expect(identity).toMatchObject({
      provider: 'buffer',
      subject: 'org-1',
      name: 'Acme',
      email: null,
    })
    expect(granted.refreshToken).toBe('rt-1')
  })

  it('refreshes once with each single-use refresh token', async () => {
    const net = fakeBuffer()
    const provider = buffer({ clientId: 'c1', fetch: net.doFetch })
    const old: TokenSet = { accessToken: 'a', refreshToken: 'rt-1', expiresAt: 0, scopes: [] }
    expect(await provider.refresh!(old)).toMatchObject({ refreshToken: 'rt-2' })
    // A public client sends no secret.
    expect(net.forms[0]!.has('client_secret')).toBe(false)
    await expect(provider.refresh!(old)).rejects.toThrow()
  })
})

describe('bufferChannels', () => {
  it('lists an organization’s channels', async () => {
    const net = fakeBuffer(() =>
      Response.json({
        data: {
          channels: [
            { id: 'ch-1', name: 'acme', service: 'instagram', avatar: null, isQueuePaused: false },
            {
              id: 'ch-2',
              name: 'acme.bsky.social',
              service: 'bluesky',
              avatar: 'https://a/x.png',
              isQueuePaused: true,
            },
          ],
        },
      }),
    )
    const channels = await bufferChannels(tokens, 'org-1', { fetch: net.doFetch })
    expect(channels.map((c) => [c.id, c.service, c.isQueuePaused])).toEqual([
      ['ch-1', 'instagram', false],
      ['ch-2', 'bluesky', true],
    ])
    expect(net.queries[0]!.query).toContain('organizationId: "org-1"')
    expect(net.queries[0]!.authorization).toBe('Bearer key-1')
  })
})

describe('bufferPublisher', () => {
  const created = () => Response.json({ data: { createPost: { post: { id: 'p-1' } } } })

  it('checks the limit of the network behind the channel', () => {
    const codes = (service: string, text: string) =>
      bufferPublisher({ service })
        .check({ text })
        .map((p) => p.code)
    expect(codes('twitter', 'x'.repeat(280))).toEqual([])
    expect(codes('twitter', 'x'.repeat(281))).toEqual(['too_long'])
    expect(codes('bluesky', '😀'.repeat(300))).toEqual([])
    expect(codes('pinterest', 'x'.repeat(5000))).toEqual([])
    const image = { data: new Blob(['x'], { type: 'image/png' }), alt: 'A chart' }
    expect(
      bufferPublisher()
        .check({ text: 'x', images: [image] })
        .map((p) => p.code),
    ).toEqual(['bad_image'])
  })

  it('shares now, or hands Buffer a later time; user text cannot break out of the query', async () => {
    const net = fakeBuffer(created)
    const publisher = bufferPublisher({
      fetch: net.doFetch,
      uploadImage: async () => 'https://cdn.example/1.png',
    })
    const text = 'Quotes " and } braces ) and a \\ backslash'
    const now = await publisher.publish(
      { tokens, subject: 'ch-1' },
      {
        text,
        link: { url: 'https://blog.example/1', title: 'ignored' },
        images: [{ data: new Blob(['x'], { type: 'image/png' }), alt: 'A chart' }],
      },
    )
    expect(now).toEqual({ id: 'p-1', url: null })
    const query = net.queries[0]!.query
    expect(query).toContain(`text: ${JSON.stringify(`${text}\n\nhttps://blog.example/1`)}`)
    expect(query).toContain('mode: shareNow')
    expect(query).toContain('assets: [{ image: { url: "https://cdn.example/1.png" } }]')

    const at = new Date(Date.now() + 3_600_000)
    await publisher.publish({ tokens, subject: 'ch-1' }, { text: 'Later' }, { createdAt: at })
    expect(net.queries[1]!.query).toContain(`mode: customScheduled, dueAt: "${at.toISOString()}"`)
  })

  it.each([
    [
      'a GraphQL error sent with a 200',
      () =>
        Response.json({
          errors: [{ message: 'Slow down', extensions: { code: 'RATE_LIMIT_EXCEEDED' } }],
        }),
      { kind: 'rate_limited', message: 'Slow down' },
    ],
    [
      'a 429 with Retry-After',
      () =>
        Response.json(
          { errors: [{ message: 'Too many' }] },
          { status: 429, headers: { 'retry-after': '90' } },
        ),
      { kind: 'rate_limited', retryAfter: 90, retryable: true },
    ],
    [
      'a rejected post (MutationError, still a 200)',
      () => Response.json({ data: { createPost: { message: 'Channel is disconnected' } } }),
      { kind: 'invalid', message: 'Channel is disconnected' },
    ],
    [
      'a refused token',
      () => Response.json({ errors: [{ message: 'No' }] }, { status: 401 }),
      { kind: 'reconnect' },
    ],
  ] as const)('reports %s', async (_, answer, expected) => {
    const error = await bufferPublisher({ fetch: fakeBuffer(answer).doFetch })
      .publish({ tokens, subject: 'ch-1' }, { text: 'Hi' })
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(PublishError)
    expect(error).toMatchObject(expected)
  })
})
