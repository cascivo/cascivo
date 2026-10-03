import { HttpError } from '@cascivo/data'
import { JwtError, verifyJwt } from './jwt'

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
  let claims: Record<string, unknown>
  try {
    claims = await verifyJwt(token, {
      jwksUrl: `https://${options.teamDomain}/cdn-cgi/access/certs`,
      issuer: `https://${options.teamDomain}`,
      audience: options.audience,
      label: 'Access',
      ...(options.leewaySeconds === undefined ? {} : { leewaySeconds: options.leewaySeconds }),
      ...(options.fetch ? { fetch: options.fetch } : {}),
    })
  } catch (error) {
    if (error instanceof JwtError) return denied(error.reason)
    throw error
  }
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

/* --------------------------------- webhooks --------------------------------- */

/**
 * How the sender signs: `github` (`X-Hub-Signature-256`), `stripe` (`Stripe-Signature`, with
 * a timestamp) or `standard` (Standard Webhooks — `webhook-id`, `webhook-timestamp`,
 * `webhook-signature` — used by Svix, Clerk, Resend and others).
 */
export type WebhookScheme = 'github' | 'stripe' | 'standard'

export interface WebhookOptions {
  scheme: WebhookScheme
  /**
   * The signing secret, a Worker secret. For `standard`, the `whsec_…` string as the sender
   * shows it.
   */
  secret: string
  /** Seconds a signed timestamp may be off (`stripe`, `standard`). Default 300. */
  toleranceSeconds?: number
}

export interface VerifiedWebhook {
  /** The body, exactly as signed. Parse it yourself: its shape is the sender's. */
  body: string
  /**
   * The delivery's id: `X-GitHub-Delivery`, `webhook-id`, or for Stripe the event's `id`
   * (`evt_…`) read from the verified body. A retry keeps its id, so store by it to ignore
   * repeats. `null` when the sender left it out.
   */
  id: string | null
}

const refused = (why: string): never => {
  throw new HttpError(401, `Webhook refused: ${why}`)
}

function hexBytes(hex: string): Uint8Array<ArrayBuffer> | null {
  if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) return null
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return bytes
}

function base64Bytes(value: string): Uint8Array<ArrayBuffer> | null {
  try {
    const binary = atob(value)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
  } catch {
    return null
  }
}

/** HMAC-SHA256 verification by WebCrypto, which compares in constant time. */
async function hmacValid(
  key: Uint8Array<ArrayBuffer>,
  signature: Uint8Array<ArrayBuffer>,
  content: string,
): Promise<boolean> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  return crypto.subtle.verify('HMAC', cryptoKey, signature, new TextEncoder().encode(content))
}

function checkTimestamp(seconds: number, tolerance: number): void {
  if (!Number.isFinite(seconds)) refused('no timestamp')
  if (Math.abs(Date.now() / 1000 - seconds) > tolerance) refused('timestamp outside the window')
}

/** A Stripe event's `id`, from a body whose signature has been checked; its shape has not. */
function stripeEventId(body: string): string | null {
  try {
    const parsed: unknown = JSON.parse(body)
    const id = typeof parsed === 'object' && parsed !== null ? Reflect.get(parsed, 'id') : null
    return typeof id === 'string' ? id : null
  } catch {
    return null
  }
}

/**
 * Verifies a webhook's signature over its raw body and returns the body. Throws
 * `HttpError(401)` for a missing or wrong signature, or (for timestamped schemes) one signed
 * outside the tolerance window — which is what stops an old, captured delivery being replayed
 * later. Call it before parsing or trusting anything in the request.
 */
export async function verifyWebhook(
  request: Request,
  options: WebhookOptions,
): Promise<VerifiedWebhook> {
  if (!options.secret) throw new Error('verifyWebhook: no secret configured')
  const body = await request.text()
  const encoder = new TextEncoder()
  const tolerance = options.toleranceSeconds ?? 300
  const header = (name: string) => request.headers.get(name)

  if (options.scheme === 'github') {
    const signature = header('x-hub-signature-256') ?? refused('no X-Hub-Signature-256')
    const bytes = hexBytes(signature.replace(/^sha256=/, '')) ?? refused('malformed signature')
    if (!(await hmacValid(encoder.encode(options.secret), bytes, body))) refused('bad signature')
    return { body, id: header('x-github-delivery') }
  }

  if (options.scheme === 'stripe') {
    const parts = (header('stripe-signature') ?? refused('no Stripe-Signature')).split(',')
    const timestamp = Number(parts.find((p) => p.startsWith('t='))?.slice(2))
    checkTimestamp(timestamp, tolerance)
    const key = encoder.encode(options.secret)
    for (const part of parts.filter((p) => p.startsWith('v1='))) {
      const bytes = hexBytes(part.slice(3))
      if (bytes && (await hmacValid(key, bytes, `${timestamp}.${body}`))) {
        return { body, id: stripeEventId(body) }
      }
    }
    return refused('bad signature')
  }

  const id = header('webhook-id') ?? refused('no webhook-id')
  const timestamp = Number(header('webhook-timestamp'))
  checkTimestamp(timestamp, tolerance)
  const key = base64Bytes(options.secret.replace(/^whsec_/, ''))
  // A wrong secret is this app's misconfiguration, not the sender's fault: a 500, not a 401.
  if (!key) throw new Error('verifyWebhook: a standard secret is "whsec_" and base64')
  // Several space-separated "v1,<base64>" signatures while a secret is being rotated.
  for (const entry of (header('webhook-signature') ?? refused('no webhook-signature')).split(' ')) {
    const [version, signature] = entry.split(',')
    const bytes = version === 'v1' && signature ? base64Bytes(signature) : null
    if (bytes && (await hmacValid(key, bytes, `${id}.${timestamp}.${body}`))) return { body, id }
  }
  return refused('bad signature')
}
