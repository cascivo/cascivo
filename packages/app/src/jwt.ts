/**
 * RS256 JWTs checked against a published JWKS: Cloudflare Access (`guard`) and OpenID Connect
 * ID tokens (`oauth`). Internal: not a published entry.
 */

export interface VerifyJwtOptions {
  /** Where the issuer publishes its signing keys. Cached per URL for an hour. */
  jwksUrl: string
  /** The `iss` the token must carry; several when the issuer uses more than one spelling. */
  issuer: string | readonly string[]
  /** The `aud` the token must carry (one of, when it is a list). */
  audience: string
  /** Seconds of clock skew allowed on `exp`/`nbf`. Default 60. */
  leewaySeconds?: number
  /** Names the issuer in key-fetch errors: "Access signing keys: 503". */
  label: string
  fetch?: typeof fetch
}

/** A token that failed a check; `reason` says which, in words fit for a 403 or a log. */
export class JwtError extends Error {
  constructor(readonly reason: string) {
    super(reason)
    this.name = 'JwtError'
  }
}

const KEY_TTL_MS = 60 * 60 * 1000
const keyCache = new Map<string, { at: number; keys: Map<string, CryptoKey> }>()

export function base64UrlDecode(part: string): Uint8Array<ArrayBuffer> {
  const base64 = part
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(part.length / 4) * 4, '=')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeJson(part: string): Record<string, unknown> {
  const value: unknown = JSON.parse(new TextDecoder().decode(base64UrlDecode(part)))
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Error('Not an object')
  return value as Record<string, unknown>
}

async function signingKeys(
  options: VerifyJwtOptions,
  refresh: boolean,
): Promise<Map<string, CryptoKey>> {
  const cached = keyCache.get(options.jwksUrl)
  if (cached && !refresh && Date.now() - cached.at < KEY_TTL_MS) return cached.keys
  const doFetch = options.fetch ?? fetch
  const response = await doFetch(options.jwksUrl)
  if (!response.ok) throw new Error(`${options.label} signing keys: ${response.status}`)
  const body: unknown = await response.json()
  const list =
    typeof body === 'object' && body !== null ? (body as { keys?: unknown }).keys : undefined
  if (!Array.isArray(list)) throw new Error(`${options.label} signing keys: no keys[]`)
  const keys = new Map<string, CryptoKey>()
  for (const raw of list) {
    if (typeof raw !== 'object' || raw === null) continue
    const { kty, kid, n, e } = raw as Record<string, unknown>
    if (kty !== 'RSA' || typeof kid !== 'string' || typeof n !== 'string' || typeof e !== 'string')
      continue
    keys.set(
      kid,
      await crypto.subtle.importKey(
        'jwk',
        { kty: 'RSA', n, e, alg: 'RS256', ext: true },
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify'],
      ),
    )
  }
  keyCache.set(options.jwksUrl, { at: Date.now(), keys })
  return keys
}

/**
 * Checks an RS256 JWT's signature against the issuer's keys, then its issuer, audience and
 * lifetime, and returns its claims. Throws `JwtError` for a token that fails, and a plain
 * `Error` when the keys cannot be fetched (the token may be fine; the issuer is not).
 */
export async function verifyJwt(
  token: string,
  options: VerifyJwtOptions,
): Promise<Record<string, unknown>> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new JwtError('malformed token')
  const [headerPart, payloadPart, signaturePart] = parts as [string, string, string]
  let header: Record<string, unknown>
  let claims: Record<string, unknown>
  try {
    header = decodeJson(headerPart)
    claims = decodeJson(payloadPart)
  } catch {
    throw new JwtError('malformed token')
  }
  const kid = header['kid']
  if (header['alg'] !== 'RS256' || typeof kid !== 'string')
    throw new JwtError('unexpected token algorithm')
  let key = (await signingKeys(options, false)).get(kid)
  // Issuers rotate their keys: an unknown kid is a reason to refetch once, not to fail.
  if (!key) key = (await signingKeys(options, true)).get(kid)
  if (!key) throw new JwtError('unknown signing key')
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    base64UrlDecode(signaturePart),
    new TextEncoder().encode(`${headerPart}.${payloadPart}`),
  )
  if (!valid) throw new JwtError('bad signature')

  const issuers: readonly string[] =
    typeof options.issuer === 'string' ? [options.issuer] : options.issuer
  if (typeof claims['iss'] !== 'string' || !issuers.includes(claims['iss']))
    throw new JwtError('wrong issuer')
  const aud = claims['aud']
  if (!(Array.isArray(aud) ? aud.includes(options.audience) : aud === options.audience)) {
    throw new JwtError('wrong audience')
  }
  const now = Date.now() / 1000
  const leeway = options.leewaySeconds ?? 60
  if (typeof claims['exp'] !== 'number' || claims['exp'] + leeway < now)
    throw new JwtError('token expired')
  if (typeof claims['nbf'] === 'number' && claims['nbf'] - leeway > now)
    throw new JwtError('token not yet valid')
  return claims
}
