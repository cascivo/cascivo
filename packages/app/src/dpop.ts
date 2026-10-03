import { base64UrlEncode } from './jwt'

/**
 * ES256 JWTs and DPoP (RFC 9449): proofs that a request comes from the holder of a key, which
 * AT Protocol (Bluesky) requires on every token and API call. Internal: used by `oauth` and
 * `social`, not a published entry.
 */

const ES256 = { name: 'ECDSA', namedCurve: 'P-256' } as const

/** A P-256 key's fields; `d` only on a private key. */
interface EcFields {
  kty: string
  crv: string
  x: string
  y: string
  d?: string
}

function ecFields(jwk: JsonWebKey, needPrivate: boolean): EcFields {
  const { kty, crv, x, y, d } = jwk
  if (kty !== 'EC' || crv !== 'P-256' || !x || !y || (needPrivate && !d)) {
    throw new Error(`Expected a P-256 ${needPrivate ? 'private ' : ''}key (ES256)`)
  }
  return { kty, crv, x, y, ...(d ? { d } : {}) }
}

/** A new P-256 key pair, as the private JWK (which holds the public half too). */
export async function newEs256Key(): Promise<JsonWebKey> {
  const pair = await crypto.subtle.generateKey(ES256, true, ['sign', 'verify'])
  return ecFields(await crypto.subtle.exportKey('jwk', pair.privateKey), true)
}

/** The public half of an EC JWK: what may be published or put in a proof's header. */
export function publicEs256(jwk: JsonWebKey): JsonWebKey & { kid?: string } {
  const { d: _private, ...pub } = ecFields(jwk, false)
  const kid = (jwk as { kid?: unknown }).kid
  return { ...pub, ...(typeof kid === 'string' ? { kid } : {}) }
}

/** Signs `header.claims` with ES256. WebCrypto's ECDSA output is already JWS's r‖s form. */
export async function signEs256(
  jwk: JsonWebKey,
  header: Record<string, unknown>,
  claims: Record<string, unknown>,
): Promise<string> {
  const key = await crypto.subtle.importKey('jwk', ecFields(jwk, true), ES256, false, ['sign'])
  const encode = (value: unknown) =>
    base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)))
  const input = `${encode({ ...header, alg: 'ES256' })}.${encode(claims)}`
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(input),
  )
  return `${input}.${base64UrlEncode(new Uint8Array(signature))}`
}

async function sha256Base64Url(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return base64UrlEncode(new Uint8Array(digest))
}

const now = () => Math.floor(Date.now() / 1000)

/** A DPoP proof for one request. `htu` is the URL without its query or fragment. */
export async function dpopProof(
  key: JsonWebKey,
  request: { method: string; url: string; nonce?: string | null; accessToken?: string },
): Promise<string> {
  const url = new URL(request.url)
  return signEs256(
    key,
    { typ: 'dpop+jwt', jwk: publicEs256(key) },
    {
      jti: crypto.randomUUID(),
      htm: request.method.toUpperCase(),
      htu: `${url.origin}${url.pathname}`,
      iat: now(),
      ...(request.nonce ? { nonce: request.nonce } : {}),
      ...(request.accessToken ? { ath: await sha256Base64Url(request.accessToken) } : {}),
    },
  )
}

/** Whether a response asks for the request again with the nonce in its `DPoP-Nonce` header. */
async function wantsNonce(response: Response): Promise<boolean> {
  if (!response.headers.get('dpop-nonce')) return false
  if (response.status === 401) {
    return /use_dpop_nonce/.test(response.headers.get('www-authenticate') ?? '')
  }
  if (response.status !== 400) return false
  const body: unknown = await response
    .clone()
    .json()
    .catch(() => null)
  return (
    typeof body === 'object' &&
    body !== null &&
    (body as { error?: unknown }).error === 'use_dpop_nonce'
  )
}

/**
 * `fetch` with a DPoP proof (and `Authorization: DPoP <token>` when given one). Servers issue
 * nonces and refuse a proof without the current one; a Worker keeps no state between requests,
 * so a refused request is sent once more with the nonce the refusal carried. The body must be
 * one that can be sent twice (a string, `URLSearchParams`, a `Blob`).
 */
export async function dpopFetch(
  doFetch: typeof fetch,
  key: JsonWebKey,
  url: string,
  init: RequestInit & { accessToken?: string } = {},
): Promise<Response> {
  const { accessToken, ...rest } = init
  const method = rest.method ?? 'GET'
  const send = async (nonce: string | null) => {
    const headers = new Headers(rest.headers)
    headers.set(
      'dpop',
      await dpopProof(key, { method, url, nonce, ...(accessToken ? { accessToken } : {}) }),
    )
    if (accessToken) headers.set('authorization', `DPoP ${accessToken}`)
    return doFetch(url, { ...rest, method, headers })
  }
  const first = await send(null)
  if (!(await wantsNonce(first))) return first
  return send(first.headers.get('dpop-nonce'))
}
