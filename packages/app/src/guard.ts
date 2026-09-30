import { HttpError } from '@cascivo/data'

/**
 * `@cascivo/app/guard` — who may call the Worker, and how often.
 *
 * - `requireAccess` — Cloudflare Access (Zero Trust) in front of an internal tool: verifies
 *   the signed JWT Access adds to every request it lets through.
 * - `verifyTurnstile` — a public form proves it was submitted by a person.
 * - `rateLimit` — the Rate Limiting binding, per caller.
 *
 * Each throws an `HttpError` (403, 429), so a `createHandler` handler — or a check at the top
 * of the Worker's `fetch` — answers with the right status and message.
 */

/* ----------------------------------- Access ---------------------------------- */

export interface AccessOptions {
  /** Your Zero Trust team domain: `acme.cloudflareaccess.com`. */
  teamDomain: string
  /** The Application Audience (AUD) tag of the Access application. */
  audience: string
  /** Default: the global fetch (for the signing keys). */
  fetch?: typeof fetch
  /** Seconds of clock skew allowed on `exp`/`nbf`. Default 60. */
  leewaySeconds?: number
}

/** Who Access let through. */
export interface AccessIdentity {
  email: string | null
  /** The user's stable id in Access (or the service token's client id). */
  subject: string
  /** Every claim, for anything else you need (groups, country…). */
  claims: Record<string, unknown>
}

interface Jwk {
  kid: string
  kty: string
  n: string
  e: string
  alg?: string
}

const KEY_TTL_MS = 60 * 60 * 1000
const keyCache = new Map<string, { at: number; keys: Map<string, CryptoKey> }>()

function base64UrlDecode(part: string): Uint8Array<ArrayBuffer> {
  const base64 = part
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(part.length / 4) * 4, '=')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function decodeJson(part: string): Record<string, unknown> {
  const value: unknown = JSON.parse(new TextDecoder().decode(base64UrlDecode(part)))
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Error('Not an object')
  return value as Record<string, unknown>
}

async function signingKeys(
  options: AccessOptions,
  refresh: boolean,
): Promise<Map<string, CryptoKey>> {
  const cached = keyCache.get(options.teamDomain)
  if (cached && !refresh && Date.now() - cached.at < KEY_TTL_MS) return cached.keys
  const doFetch = options.fetch ?? fetch
  const response = await doFetch(`https://${options.teamDomain}/cdn-cgi/access/certs`)
  if (!response.ok) throw new Error(`Access signing keys: ${response.status}`)
  const body: unknown = await response.json()
  const list =
    typeof body === 'object' && body !== null ? (body as { keys?: unknown }).keys : undefined
  if (!Array.isArray(list)) throw new Error('Access signing keys: no keys[]')
  const keys = new Map<string, CryptoKey>()
  for (const raw of list) {
    if (typeof raw !== 'object' || raw === null) continue
    const jwk = raw as Partial<Jwk>
    if (
      jwk.kty !== 'RSA' ||
      typeof jwk.kid !== 'string' ||
      typeof jwk.n !== 'string' ||
      typeof jwk.e !== 'string'
    ) {
      continue
    }
    keys.set(
      jwk.kid,
      await crypto.subtle.importKey(
        'jwk',
        { kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify'],
      ),
    )
  }
  keyCache.set(options.teamDomain, { at: Date.now(), keys })
  return keys
}

const denied = (why: string): never => {
  throw new HttpError(403, `Access denied: ${why}`)
}

/**
 * Verifies the Access JWT on a request (the `Cf-Access-Jwt-Assertion` header, or the
 * `CF_Authorization` cookie): its RS256 signature against your team's published keys, its
 * issuer, its audience and its lifetime. Throws `HttpError(403)` otherwise — so a request
 * that reached the Worker around Access (straight to `*.workers.dev`, say) is refused.
 */
export async function requireAccess(
  request: Request,
  options: AccessOptions,
): Promise<AccessIdentity> {
  // Empty settings are a deploy that was never configured: refuse everyone, and say why.
  if (!options.teamDomain || !options.audience) {
    throw new HttpError(500, 'Access is not configured: set the team domain and the audience (AUD)')
  }
  const token =
    request.headers.get('cf-access-jwt-assertion') ??
    /(?:^|;\s*)CF_Authorization=([^;]+)/.exec(request.headers.get('cookie') ?? '')?.[1] ??
    denied('no Access token')
  const parts = token.split('.')
  if (parts.length !== 3) denied('malformed token')
  const [headerPart, payloadPart, signaturePart] = parts as [string, string, string]
  let header: Record<string, unknown>
  let claims: Record<string, unknown>
  try {
    header = decodeJson(headerPart)
    claims = decodeJson(payloadPart)
  } catch {
    return denied('malformed token')
  }
  if (header['alg'] !== 'RS256' || typeof header['kid'] !== 'string')
    denied('unexpected token algorithm')
  const kid = header['kid'] as string
  let key = (await signingKeys(options, false)).get(kid)
  // Access rotates its keys: an unknown kid is a reason to refetch once, not to fail.
  if (!key) key = (await signingKeys(options, true)).get(kid)
  if (!key) return denied('unknown signing key')
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    base64UrlDecode(signaturePart),
    new TextEncoder().encode(`${headerPart}.${payloadPart}`),
  )
  if (!valid) denied('bad signature')

  if (claims['iss'] !== `https://${options.teamDomain}`) denied('wrong issuer')
  const aud = claims['aud']
  if (!(Array.isArray(aud) ? aud.includes(options.audience) : aud === options.audience)) {
    denied('wrong audience')
  }
  const now = Date.now() / 1000
  const leeway = options.leewaySeconds ?? 60
  if (typeof claims['exp'] !== 'number' || claims['exp'] + leeway < now) denied('token expired')
  if (typeof claims['nbf'] === 'number' && claims['nbf'] - leeway > now)
    denied('token not yet valid')
  const subject = claims['sub'] ?? claims['common_name']
  if (typeof subject !== 'string') return denied('no subject')
  return { email: typeof claims['email'] === 'string' ? claims['email'] : null, subject, claims }
}

/* --------------------------------- Turnstile --------------------------------- */

export interface TurnstileOptions {
  /** The widget's secret key — a Worker secret. */
  secret: string
  /** The caller's IP (`clientIp(request)`), which Turnstile checks against. */
  remoteIp?: string
  /** Refuse a token issued for another widget action. */
  action?: string
  /** Refuse a token issued on another hostname. */
  hostname?: string
  fetch?: typeof fetch
}

/**
 * Verifies a Turnstile token with Cloudflare's siteverify API. Throws `HttpError(403)` when it
 * is missing, invalid, spent or for another action/hostname. A token is single-use: verify it
 * once, at the request it came with.
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  options: TurnstileOptions,
): Promise<void> {
  if (!token || token.length > 2048) throw new HttpError(403, 'Complete the challenge first')
  const form = new FormData()
  form.set('secret', options.secret)
  form.set('response', token)
  if (options.remoteIp) form.set('remoteip', options.remoteIp)
  const doFetch = options.fetch ?? fetch
  const response = await doFetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  })
  const body: unknown = await response.json().catch(() => null)
  if (typeof body !== 'object' || body === null)
    throw new Error('Turnstile siteverify returned no JSON')
  const result = body as Record<string, unknown>
  if (result['success'] !== true) {
    const codes = Array.isArray(result['error-codes'])
      ? result['error-codes'].join(', ')
      : 'unknown'
    throw new HttpError(403, `The challenge failed (${codes})`)
  }
  if (options.action !== undefined && result['action'] !== options.action) {
    throw new HttpError(403, 'The challenge was for another form')
  }
  if (options.hostname !== undefined && result['hostname'] !== options.hostname) {
    throw new HttpError(403, 'The challenge was for another site')
  }
}

/* -------------------------------- rate limits -------------------------------- */

/** What `rateLimit` needs of a Rate Limiting binding (`ratelimits` in wrangler.jsonc). */
export interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>
}

/**
 * Counts one call for `key` (a user, an IP, an API key) and throws `HttpError(429)` once the
 * binding's limit is reached. The limit and period live in wrangler.jsonc.
 */
export async function rateLimit(limiter: RateLimiter, key: string): Promise<void> {
  const { success } = await limiter.limit({ key })
  if (!success) throw new HttpError(429, 'Too many requests — try again in a minute')
}

/** The caller's IP as Cloudflare saw it, or `'unknown'` outside Cloudflare. */
export function clientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip') ?? 'unknown'
}

/**
 * Answers an `HttpError` from a guard with its status and message; anything else is thrown
 * on. For guards that run in `fetch` before `createHandler` gets the request.
 */
export function guardResponse(error: unknown): Response {
  if (error instanceof HttpError)
    return Response.json({ error: error.message }, { status: error.status })
  throw error
}
