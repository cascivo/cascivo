// @vitest-environment node
import { HttpError } from '@cascivo/data'
import { describe, expect, it } from 'vitest'
import { clientIp, guardResponse, rateLimit, requireAccess, verifyTurnstile } from './guard'
import type { RateLimiter } from './guard'

const TEAM = 'acme.cloudflareaccess.com'
const AUD = 'aud-123'

const b64url = (bytes: Uint8Array | string) =>
  Buffer.from(typeof bytes === 'string' ? new TextEncoder().encode(bytes) : bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

let teams = 0

/**
 * An Access team: a signing key, its JWKS endpoint, and tokens signed with it. Each has its
 * own domain, because signing keys are cached per team domain, as they are in production.
 */
async function team() {
  const domain = `team${++teams}.cloudflareaccess.com`
  let rotations = 0
  const make = async (kid: string) => {
    const pair = await crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['sign', 'verify'],
    )
    const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey)
    return { kid, pair, jwk: { kid, kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RS256' } }
  }
  let keys = [await make('k1')]
  const fetches: string[] = []
  const fakeFetch = (async (url: string) => {
    fetches.push(url)
    return Response.json({ keys: keys.map((k) => k.jwk) })
  }) as typeof fetch
  const sign = async (claims: Record<string, unknown>, kid = keys[0]!.kid, alg = 'RS256') => {
    const key = keys.find((k) => k.kid === kid) ?? keys[0]!
    const head = b64url(JSON.stringify({ alg, kid, typ: 'JWT' }))
    const body = b64url(JSON.stringify(claims))
    const sig = new Uint8Array(
      await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        key.pair.privateKey,
        new TextEncoder().encode(`${head}.${body}`),
      ),
    )
    return `${head}.${body}.${b64url(sig)}`
  }
  const rotate = async () => {
    keys = [await make(`k${++rotations + 1}`)]
  }
  const claims = { ...valid, iss: `https://${domain}` }
  return {
    sign,
    rotate,
    fetches,
    claims,
    options: { teamDomain: domain, audience: AUD, fetch: fakeFetch },
  }
}

const now = () => Math.floor(Date.now() / 1000)
const valid = {
  iss: `https://${TEAM}`,
  aud: [AUD],
  sub: 'user-1',
  email: 'ada@acme.com',
  exp: now() + 600,
  iat: now(),
}
const withToken = (token: string) =>
  new Request('https://app.acme.com/api/x', { headers: { 'cf-access-jwt-assertion': token } })

describe('requireAccess', () => {
  it('accepts a token Access signed for this application', async () => {
    const t = await team()
    const who = await requireAccess(withToken(await t.sign(t.claims)), {
      ...t.options,
      teamDomain: 'a.' + TEAM,
    }).catch(() => null)
    expect(who).toBeNull() // wrong team domain: other keys, other issuer
    const identity = await requireAccess(withToken(await t.sign(t.claims)), t.options)
    void TEAM
    expect(identity).toMatchObject({ email: 'ada@acme.com', subject: 'user-1' })
  })

  it('reads the CF_Authorization cookie when the header is absent', async () => {
    const t = await team()
    const request = new Request('https://app.acme.com/', {
      headers: { cookie: `x=1; CF_Authorization=${await t.sign(t.claims)}` },
    })
    await expect(requireAccess(request, t.options)).resolves.toMatchObject({ subject: 'user-1' })
  })

  it.each([
    ['another audience', { ...valid, aud: ['someone-else'] }],
    ['another issuer', { ...valid, iss: 'https://evil.cloudflareaccess.com' }],
    ['an expired token', { ...valid, exp: now() - 3600 }],
    ['a token not valid yet', { ...valid, nbf: now() + 3600 }],
    ['no subject', { ...valid, sub: undefined }],
  ])('refuses %s', async (_, claims) => {
    const t = await team()
    const iss = claims.iss === valid.iss ? t.claims.iss : claims.iss
    await expect(
      requireAccess(withToken(await t.sign({ ...claims, iss })), t.options),
    ).rejects.toMatchObject({
      status: 403,
    })
  })

  it('refuses a tampered token, no token, and alg:none', async () => {
    const t = await team()
    const token = await t.sign(t.claims)
    const [h, , s] = token.split('.')
    const forged = `${h}.${b64url(JSON.stringify({ ...t.claims, email: 'boss@acme.com' }))}.${s}`
    await expect(requireAccess(withToken(forged), t.options)).rejects.toThrow(/bad signature/)
    await expect(requireAccess(new Request('https://x/'), t.options)).rejects.toThrow(
      /no Access token/,
    )
    const none = `${b64url(JSON.stringify({ alg: 'none', kid: 'k1' }))}.${b64url(JSON.stringify(valid))}.`
    await expect(requireAccess(withToken(none), t.options)).rejects.toMatchObject({ status: 403 })
  })

  it('refuses everyone, with a 500, until the team domain and audience are set', async () => {
    const t = await team()
    const token = await t.sign(t.claims)
    for (const options of [
      { ...t.options, teamDomain: '' },
      { ...t.options, audience: '' },
    ]) {
      await expect(requireAccess(withToken(token), options)).rejects.toMatchObject({ status: 500 })
    }
    expect(t.fetches).toHaveLength(0)
  })

  it('refetches the keys once when Access has rotated them', async () => {
    const t = await team()
    await requireAccess(withToken(await t.sign(t.claims)), t.options)
    const before = t.fetches.length
    await t.rotate()
    await expect(
      requireAccess(withToken(await t.sign(t.claims, 'k2')), t.options),
    ).resolves.toBeTruthy()
    expect(t.fetches.length).toBe(before + 1)
  })
})

describe('verifyTurnstile', () => {
  it('accepts a token Cloudflare verifies, and refuses a failed one', async () => {
    const seen: string[] = []
    const siteverify = (success: boolean, extra: Record<string, unknown> = {}) =>
      (async (_url: string, init: RequestInit) => {
        const form = init.body as FormData
        seen.push(`${form.get('secret')}|${form.get('response')}|${form.get('remoteip')}`)
        return Response.json({
          success,
          'error-codes': success ? [] : ['invalid-input-response'],
          hostname: 'app.acme.com',
          action: 'signup',
          ...extra,
        })
      }) as typeof fetch
    await verifyTurnstile('tok', {
      secret: 's',
      remoteIp: '1.2.3.4',
      fetch: siteverify(true),
      action: 'signup',
    })
    expect(seen).toEqual(['s|tok|1.2.3.4'])
    await expect(verifyTurnstile('tok', { secret: 's', fetch: siteverify(false) })).rejects.toThrow(
      /invalid-input-response/,
    )
    await expect(
      verifyTurnstile('tok', { secret: 's', fetch: siteverify(true), action: 'login' }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      verifyTurnstile('tok', { secret: 's', fetch: siteverify(true), hostname: 'other.com' }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      verifyTurnstile('', { secret: 's', fetch: siteverify(true) }),
    ).rejects.toMatchObject({ status: 403 })
  })
})

describe('rateLimit and helpers', () => {
  it('lets calls through until the binding says no, then answers 429', async () => {
    let calls = 0
    const limiter: RateLimiter = { limit: async () => ({ success: ++calls <= 2 }) }
    await rateLimit(limiter, 'ip')
    await rateLimit(limiter, 'ip')
    const error = await rateLimit(limiter, 'ip').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(HttpError)
    const response = guardResponse(error)
    expect(response.status).toBe(429)
    expect(() => guardResponse(new Error('boom'))).toThrow('boom')
  })

  it('reads the client IP Cloudflare set', () => {
    expect(
      clientIp(new Request('https://x/', { headers: { 'cf-connecting-ip': '9.9.9.9' } })),
    ).toBe('9.9.9.9')
    expect(clientIp(new Request('https://x/'))).toBe('unknown')
  })
})
