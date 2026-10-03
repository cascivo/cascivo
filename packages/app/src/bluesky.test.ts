// @vitest-environment node
import { createHash, createPublicKey, createVerify } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { newEs256Key } from './dpop'
import {
  beginAuthorization,
  bluesky,
  blueskyClientMetadata,
  blueskyJwks,
  completeAuthorization,
  OAuthError,
  parseBlueskyKey,
} from './oauth'
import type { BlueskyKey, PendingAuthorization, TokenSet } from './oauth'
import { blueskyFacets, blueskyLength, blueskyPublisher, blueskyRecordKey } from './social'

const DID = 'did:plc:abcdefghijklmnopqrstuvwx'
const OTHER = 'did:plc:zzzzzzzzzzzzzzzzzzzzzzzz'
const PDS = 'https://pds.example'
const ISSUER = 'https://auth.example'
const REDIRECT = 'http://127.0.0.1:5173/api/connections/bluesky/callback'

const part = (jws: string, i: number) =>
  JSON.parse(Buffer.from(jws.split('.')[i]!, 'base64url').toString()) as Record<string, unknown>

/** Verifies an ES256 JWS with Node's crypto: an implementation independent of ours. */
function verifies(jws: string, jwk: JsonWebKey): boolean {
  const [h, p, sig] = jws.split('.')
  const key = createPublicKey({ key: jwk as never, format: 'jwk' })
  return createVerify('SHA256')
    .update(`${h}.${p}`)
    .verify({ key, dsaEncoding: 'ieee-p1363' }, Buffer.from(sig!, 'base64url'))
}

interface Shape {
  /** Where the handle resolves: DNS, the well-known file, or nowhere. */
  handleVia?: 'dns' | 'https' | 'none'
  /** The DID document claims another handle. */
  docHandle?: string
  /** The authorization server's metadata names another issuer. */
  lyingIssuer?: boolean
  /** The token endpoint sits on another host. */
  foreignToken?: boolean
  /** The token response names this DID. */
  tokensFor?: string
  /** The app's key, to check client assertions against. */
  appKey?: JsonWebKey
}

/** DNS, PLC, a PDS and its authorization server; every DPoP proof is checked as a server would. */
function network(shape: Shape = {}) {
  const nonces = { auth: 'n-auth-1', pds: 'n-pds-1' }
  const log: { url: string; form: URLSearchParams | null; headers: Headers; body: unknown }[] = []
  const problems: string[] = []
  const records = new Map<string, unknown>()
  let refreshToken = 'rt-1'

  /** A server's DPoP check: signature, method, URL, nonce, and the token hash when given one. */
  function checkProof(
    headers: Headers,
    method: string,
    url: string,
    nonce: string,
    token?: string,
  ) {
    const proof = headers.get('dpop')
    if (!proof) return 'no proof'
    const head = part(proof, 0)
    const claims = part(proof, 1)
    if (head['typ'] !== 'dpop+jwt' || head['alg'] !== 'ES256') return 'bad header'
    if (!verifies(proof, head['jwk'] as JsonWebKey)) return 'bad signature'
    const u = new URL(url)
    if (claims['htm'] !== method || claims['htu'] !== `${u.origin}${u.pathname}`)
      return 'wrong target'
    if (token && claims['ath'] !== createHash('sha256').update(token).digest('base64url'))
      return 'bad ath'
    if (claims['nonce'] !== nonce) return 'nonce'
    return null
  }

  const doFetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    const headers = new Headers(init?.headers)
    const raw = init?.body
    const form =
      typeof raw === 'string' && headers.get('content-type')?.includes('form')
        ? new URLSearchParams(raw)
        : null
    const body = typeof raw === 'string' && !form ? (JSON.parse(raw) as unknown) : raw
    log.push({ url, form, headers, body })
    const u = new URL(url)
    const authProof = (): Response | null => {
      const problem = checkProof(headers, init?.method ?? 'GET', url, nonces.auth)
      if (problem === 'nonce') {
        return Response.json(
          { error: 'use_dpop_nonce' },
          { status: 400, headers: { 'dpop-nonce': nonces.auth } },
        )
      }
      if (problem) problems.push(`${u.pathname}: ${problem}`)
      return null
    }
    const clientAuthOk = (f: URLSearchParams) => {
      if (!shape.appKey) return f.get('client_assertion') === null
      const assertion = f.get('client_assertion')!
      const claims = part(assertion, 1)
      return (
        verifies(assertion, shape.appKey) &&
        claims['aud'] === ISSUER &&
        claims['iss'] === f.get('client_id') &&
        claims['sub'] === f.get('client_id')
      )
    }

    if (u.host === 'cloudflare-dns.com') {
      const answers =
        shape.handleVia === 'dns' || shape.handleVia === undefined ? [{ data: `"did=${DID}"` }] : []
      return Response.json({ Answer: answers })
    }
    if (url === 'https://ada.example/.well-known/atproto-did') {
      return shape.handleVia === 'https' ? new Response(DID) : new Response('nope', { status: 404 })
    }
    if (url === `https://plc.directory/${DID}`) {
      return Response.json({
        id: DID,
        alsoKnownAs: [`at://${shape.docHandle ?? 'ada.example'}`],
        service: [{ id: '#atproto_pds', type: 'AtprotoPersonalDataServer', serviceEndpoint: PDS }],
      })
    }
    if (url === `${PDS}/.well-known/oauth-protected-resource`) {
      return Response.json({ resource: PDS, authorization_servers: [ISSUER] })
    }
    if (url === `${ISSUER}/.well-known/oauth-authorization-server`) {
      return Response.json({
        issuer: shape.lyingIssuer ? 'https://someone-else.example' : ISSUER,
        pushed_authorization_request_endpoint: `${ISSUER}/oauth/par`,
        authorization_endpoint: `${ISSUER}/oauth/authorize`,
        token_endpoint: shape.foreignToken
          ? 'https://collector.example/token'
          : `${ISSUER}/oauth/token`,
        dpop_signing_alg_values_supported: ['ES256'],
      })
    }
    if (url === `${ISSUER}/oauth/par`) {
      const retry = authProof()
      if (retry) return retry
      if (!form || !clientAuthOk(form)) problems.push('par: client auth')
      return Response.json(
        { request_uri: 'urn:ietf:params:oauth:request_uri:req-1', expires_in: 60 },
        { status: 201, headers: { 'dpop-nonce': nonces.auth } },
      )
    }
    if (url === `${ISSUER}/oauth/token`) {
      const retry = authProof()
      if (retry) return retry
      if (!form || !clientAuthOk(form)) problems.push('token: client auth')
      if (form?.get('grant_type') === 'refresh_token') {
        if (form.get('refresh_token') !== refreshToken)
          return Response.json({ error: 'invalid_grant' }, { status: 400 })
        refreshToken = 'rt-2'
      }
      return Response.json({
        access_token: `at-${refreshToken}`,
        token_type: 'DPoP',
        refresh_token: refreshToken,
        expires_in: 900,
        scope: 'atproto transition:generic',
        sub: shape.tokensFor ?? DID,
      })
    }
    if (u.origin === PDS && u.pathname.startsWith('/xrpc/')) {
      const method = u.pathname.slice('/xrpc/'.length)
      if (method === 'com.atproto.identity.resolveHandle') {
        return u.searchParams.get('handle') === 'grace.example'
          ? Response.json({ did: OTHER })
          : Response.json({ error: 'InvalidRequest' }, { status: 400 })
      }
      if (method === 'com.atproto.repo.getRecord') {
        const record = records.get(u.searchParams.get('rkey')!)
        return record
          ? Response.json({
              uri: `at://${DID}/app.bsky.feed.post/${u.searchParams.get('rkey')}`,
              value: record,
            })
          : Response.json({ error: 'RecordNotFound' }, { status: 400 })
      }
      const token = headers.get('authorization')?.replace(/^DPoP /, '')
      const problem = checkProof(headers, init?.method ?? 'GET', url, nonces.pds, token)
      if (problem === 'nonce') {
        return new Response(JSON.stringify({ error: 'use_dpop_nonce' }), {
          status: 401,
          headers: { 'www-authenticate': 'DPoP error="use_dpop_nonce"', 'dpop-nonce': nonces.pds },
        })
      }
      if (problem) problems.push(`${method}: ${problem}`)
      if (method === 'com.atproto.repo.uploadBlob') {
        return Response.json({
          blob: {
            $type: 'blob',
            ref: { $link: 'bafy1' },
            mimeType: headers.get('content-type'),
            size: 3,
          },
        })
      }
      if (method === 'com.atproto.repo.createRecord') {
        const b = body as { rkey?: string; record: unknown }
        const rkey = b.rkey ?? 'serverkey000a'
        records.set(rkey, b.record)
        return Response.json({ uri: `at://${DID}/app.bsky.feed.post/${rkey}`, cid: 'bafy2' })
      }
    }
    throw new Error(`Unexpected fetch ${url}`)
  }) as typeof fetch

  return { doFetch, log, problems, records }
}

async function signIn(
  net: ReturnType<typeof network>,
  options: Parameters<typeof bluesky>[0] = {},
  redirect = REDIRECT,
) {
  const provider = bluesky({ ...options, fetch: net.doFetch })
  const resolved = await provider.forServer!('@Ada.Example', redirect)
  const { url, pending } = await beginAuthorization(resolved, {
    redirectUri: redirect,
    server: resolved.server!,
  })
  const callback = new URLSearchParams({ state: pending.state, code: 'code-1', iss: ISSUER })
  return { provider, resolved, url: new URL(url), pending, callback }
}

describe('bluesky(): resolving the account', () => {
  it('finds the DID by DNS, and by the well-known file when DNS has none', async () => {
    expect(
      (await bluesky({ fetch: network().doFetch }).forServer!('ada.example', REDIRECT)).server,
    ).toBe(DID)
    const viaHttps = network({ handleVia: 'https' })
    expect(
      (await bluesky({ fetch: viaHttps.doFetch }).forServer!('ada.example', REDIRECT)).server,
    ).toBe(DID)
    await expect(
      bluesky({ fetch: network({ handleVia: 'none' }).doFetch }).forServer!(
        'ada.example',
        REDIRECT,
      ),
    ).rejects.toMatchObject({ code: 'bad_server' })
  })

  it.each([
    ['a DID document that claims another handle', { docHandle: 'mallory.example' }],
    ['metadata that names another issuer', { lyingIssuer: true }],
    ['a token endpoint on another host', { foreignToken: true }],
  ] as const)('refuses %s', async (_, shape) => {
    await expect(
      bluesky({ fetch: network(shape).doFetch }).forServer!('ada.example', REDIRECT),
    ).rejects.toBeInstanceOf(OAuthError)
  })

  it('refuses localhost in development, where only 127.0.0.1 can be a redirect', async () => {
    await expect(
      bluesky({ fetch: network().doFetch }).forServer!('ada.example', 'http://localhost:5173/cb'),
    ).rejects.toThrow(/127\.0\.0\.1/)
  })
})

describe('bluesky(): the flow', () => {
  it('pushes the request with PKCE and a DPoP proof (with the nonce on the retry)', async () => {
    const net = network()
    const { url, pending } = await signIn(net)
    expect(url.origin + url.pathname).toBe(`${ISSUER}/oauth/authorize`)
    expect(url.searchParams.get('request_uri')).toBe('urn:ietf:params:oauth:request_uri:req-1')
    // The development (loopback) client: its id carries the redirect and the scope.
    const clientId = new URL(url.searchParams.get('client_id')!)
    expect(clientId.origin).toBe('http://localhost')
    expect(clientId.searchParams.get('redirect_uri')).toBe(REDIRECT)
    const par = net.log.filter((l) => l.url.endsWith('/oauth/par'))
    expect(par).toHaveLength(2) // refused for the nonce, then accepted
    expect(par[1]!.form!.get('code_challenge_method')).toBe('S256')
    expect(par[1]!.form!.get('login_hint')).toBe('ada.example')
    expect(pending.dpopKey).toMatchObject({ kty: 'EC', crv: 'P-256' })
    expect(net.problems).toEqual([])
  })

  it('binds the tokens to the key, and names the account by DID and verified handle', async () => {
    const net = network()
    const { resolved, pending, callback } = await signIn(net)
    const { tokens, identity } = await completeAuthorization(resolved, pending, callback)
    expect(tokens.dpop).toMatchObject({ key: pending.dpopKey, issuer: ISSUER })
    expect(tokens.expiresAt).toBeGreaterThan(Date.now() / 1000)
    expect(identity).toEqual({
      provider: 'bluesky',
      subject: DID,
      email: null,
      name: null,
      handle: '@ada.example',
      avatarUrl: null,
      server: 'pds.example',
    })
    expect(net.problems).toEqual([])
  })

  it('reads the display name and avatar from the profile on the account’s own PDS', async () => {
    const net = network()
    net.records.set('self', {
      $type: 'app.bsky.actor.profile',
      displayName: '  Ada Lovelace ',
      avatar: { $type: 'blob', ref: { $link: 'bafkreiavatar' }, mimeType: 'image/jpeg', size: 9 },
    })
    const { resolved, pending, callback } = await signIn(net)
    const { identity } = await completeAuthorization(resolved, pending, callback)
    expect(identity.name).toBe('Ada Lovelace')
    expect(identity.avatarUrl).toBe(
      `${PDS}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(DID)}&cid=bafkreiavatar`,
    )
    // A ref that is not a CID makes no URL.
    net.records.set('self', { displayName: 'Ada', avatar: { ref: { $link: '../x?y' } } })
    const again = await signIn(net)
    const second = await completeAuthorization(again.resolved, again.pending, again.callback)
    expect(second.identity).toMatchObject({ name: 'Ada', avatarUrl: null })
  })

  it('refuses a callback from another issuer, and tokens for another account', async () => {
    const net = network()
    const { resolved, pending, callback } = await signIn(net)
    callback.set('iss', 'https://evil.example')
    await expect(completeAuthorization(resolved, pending, callback)).rejects.toThrow(
      /another authorization server/,
    )
    // A server that issues tokens naming someone else's DID: the attack the check exists for.
    const hostile = network({ tokensFor: OTHER })
    const flow = await signIn(hostile)
    await expect(completeAuthorization(flow.resolved, flow.pending, flow.callback)).rejects.toThrow(
      /another account/,
    )
  })

  it('authenticates as a confidential client with a signed assertion', async () => {
    const appKey = { ...(await newEs256Key()), kid: 'k1' } as BlueskyKey
    const net = network({ appKey })
    const { resolved, pending, callback, url } = await signIn(
      net,
      { privateKey: appKey },
      'https://app.example/api/connections/bluesky/callback',
    )
    expect(url.searchParams.get('client_id')).toBe('https://app.example/oauth/client-metadata.json')
    await completeAuthorization(resolved, pending, callback)
    expect(net.problems).toEqual([])
  })

  it('refreshes with the same key, and the rotated refresh token is stored', async () => {
    const net = network()
    const { provider, resolved, pending, callback } = await signIn(net)
    const { tokens } = await completeAuthorization(resolved, pending, callback)
    const fresh = await provider.refresh!(tokens)
    expect(fresh).toMatchObject({ refreshToken: 'rt-2', accessToken: 'at-rt-2' })
    expect(fresh.dpop?.key).toEqual(tokens.dpop?.key)
    await expect(provider.refresh!(tokens)).rejects.toBeInstanceOf(OAuthError) // the old one is spent
    expect(net.problems).toEqual([])
  })
})

describe('client metadata', () => {
  it('describes a confidential client, and publishes only the public key', async () => {
    const key = { ...(await newEs256Key()), kid: 'k1' } as BlueskyKey
    const meta = blueskyClientMetadata({
      origin: 'https://app.example/x',
      redirectPaths: ['/api/connections/bluesky/callback'],
      clientName: 'Acme',
      privateKey: key,
    })
    expect(meta).toMatchObject({
      client_id: 'https://app.example/oauth/client-metadata.json',
      redirect_uris: ['https://app.example/api/connections/bluesky/callback'],
      dpop_bound_access_tokens: true,
      token_endpoint_auth_method: 'private_key_jwt',
      jwks_uri: 'https://app.example/oauth/jwks.json',
    })
    const jwks = blueskyJwks(key)
    expect(jwks.keys[0]).toMatchObject({ kid: 'k1', alg: 'ES256' })
    expect(jwks.keys[0]).not.toHaveProperty('d')
    expect(parseBlueskyKey(JSON.stringify(key))).toEqual(key)
    expect(() => parseBlueskyKey('{"kty":"EC"}')).toThrow(/P-256/)
  })
})

describe('blueskyPublisher', () => {
  async function session(net: ReturnType<typeof network>): Promise<TokenSet> {
    const { resolved, pending, callback } = await signIn(net)
    return (await completeAuthorization(resolved, pending as PendingAuthorization, callback)).tokens
  }

  it('counts graphemes, and finds links, tags and mentions at UTF-8 byte offsets', async () => {
    expect(blueskyLength('👩‍👩‍👧 é')).toBe(3)
    const text = '😀 see https://a.example/x. #cascivo @grace.example @nobody.example'
    const facets = await blueskyFacets(text, async (h) => (h === 'grace.example' ? OTHER : null))
    const bytes = Buffer.from(text)
    const slice = (f: (typeof facets)[number]) =>
      bytes.subarray(f.index.byteStart, f.index.byteEnd).toString()
    expect(facets.map(slice)).toEqual(['https://a.example/x', '#cascivo', '@grace.example'])
    expect(facets.map((f) => f.features[0])).toEqual([
      { $type: 'app.bsky.richtext.facet#link', uri: 'https://a.example/x' },
      { $type: 'app.bsky.richtext.facet#tag', tag: 'cascivo' },
      { $type: 'app.bsky.richtext.facet#mention', did: OTHER },
    ])
  })

  it('derives a stable, well-formed record key', async () => {
    const at = new Date('2026-10-03T12:00:00Z')
    const key = await blueskyRecordKey(at, 'post-1:acct')
    expect(key).toMatch(/^[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$/)
    expect(await blueskyRecordKey(at, 'post-1:acct')).toBe(key)
    expect(await blueskyRecordKey(at, 'post-2:acct')).not.toBe(key)
  })

  it('checks what Bluesky would refuse', () => {
    const p = blueskyPublisher()
    const codes = (post: Parameters<typeof p.check>[0]) => p.check(post).map((x) => x.code)
    expect(codes({ text: '😀'.repeat(300) })).toEqual([])
    expect(codes({ text: 'x'.repeat(301) })).toEqual(['too_long'])
    const big = { data: new Blob([new Uint8Array(1_000_001)], { type: 'image/png' }), alt: 'big' }
    expect(codes({ text: 'x', images: [big] })).toEqual(['bad_image'])
    expect(codes({ text: 'x', link: { url: 'https://a.example', title: '' } })).toEqual([
      'bad_link',
    ])
  })

  it('posts with DPoP-bound calls, and a retry finds the post instead of posting twice', async () => {
    const net = network()
    const tokens = await session(net)
    const publisher = blueskyPublisher({ fetch: net.doFetch, langs: ['en'] })
    const target = { tokens, subject: DID, server: 'pds.example' }
    const post = {
      text: 'Hello @grace.example',
      images: [{ data: new Blob(['png'], { type: 'image/png' }), alt: 'A chart' }],
    }
    const options = { idempotencyKey: 'post-1:acct', createdAt: new Date('2026-10-03T12:00:00Z') }
    const first = await publisher.publish(target, post, options)
    const rkey = await blueskyRecordKey(options.createdAt, options.idempotencyKey)
    expect(first).toEqual({
      id: `at://${DID}/app.bsky.feed.post/${rkey}`,
      url: `https://bsky.app/profile/${DID}/post/${rkey}`,
    })
    const record = net.records.get(rkey) as Record<string, unknown>
    expect(record).toMatchObject({
      text: 'Hello @grace.example',
      createdAt: '2026-10-03T12:00:00.000Z',
      langs: ['en'],
      embed: { $type: 'app.bsky.embed.images', images: [{ alt: 'A chart' }] },
      facets: [{ features: [{ did: OTHER }] }],
    })
    const creates = () => net.log.filter((l) => l.url.endsWith('createRecord')).length
    const before = creates()
    expect(await publisher.publish(target, post, options)).toEqual(first)
    expect(creates()).toBe(before)
    expect(net.problems).toEqual([])
  })

  it('reports a refused token as reconnect', async () => {
    const tokens: TokenSet = { accessToken: 'x', refreshToken: null, expiresAt: null, scopes: [] }
    await expect(
      blueskyPublisher().publish({ tokens, subject: DID, server: 'pds.example' }, { text: 'Hi' }),
    ).rejects.toMatchObject({ kind: 'reconnect' })
  })
})
