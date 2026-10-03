import { dpopFetch, newEs256Key, publicEs256, signEs256 } from './dpop'
import { base64UrlDecode, base64UrlEncode, JwtError, verifyJwt } from './jwt'

/**
 * `@cascivo/app/oauth` — the authorization-code flow against an OAuth provider, and adapters
 * for Google, GitHub, LinkedIn, Mastodon, Bluesky and Buffer. It knows the protocol and the provider, nothing else: no database, no
 * cookies, no users. What happens to the tokens is the caller's choice: `handleOAuth`
 * (`@cascivo/app/oauth-server`) turns the identity into a session and drops them; an app that
 * posts or reads on the user's behalf keeps them, sealed with `seal`. It runs anywhere with
 * `fetch` and WebCrypto: a Worker, Node, Deno, a browser extension's background page.
 *
 * ```ts
 * const provider = github({ clientId, clientSecret })
 * // 1. Send the browser to the provider; keep `pending` (sealed) until it comes back.
 * const { url, pending } = await beginAuthorization(provider, { redirectUri })
 * // 2. On the redirect back: checks state, exchanges the code, says who it is.
 * const { tokens, identity } = await completeAuthorization(provider, pending, callbackUrl.searchParams)
 * ```
 */

/** What a provider granted. Times are Unix seconds. */
export interface TokenSet {
  accessToken: string
  /** `null` when the provider issued none (GitHub OAuth Apps; Google without `offline`). */
  refreshToken: string | null
  /** `null` when the token does not expire. */
  expiresAt: number | null
  /** The scopes granted, which can be fewer than the ones asked for. */
  scopes: string[]
  /**
   * Present when the tokens are bound to a key (DPoP: AT Protocol, Bluesky). Every use of them
   * must prove possession of `key`, and renewing them goes to `issuer` as `clientId`.
   */
  dpop?: { key: JsonWebKey; issuer: string; clientId: string }
}

/** Who signed in, as the provider describes them. */
export interface Identity {
  /** The provider's `id`: `'google'`, `'github'`. */
  provider: string
  /** Stable at this provider: Google's `sub`, GitHub's numeric id. Never an email or a login. */
  subject: string
  /**
   * Lowercased, and set **only** when the provider vouches that this person controls it.
   * Anything that links accounts by email must use this field and nothing looser.
   */
  email: string | null
  name: string | null
  /** A username where the provider has one (GitHub's login); it can change. */
  handle: string | null
  avatarUrl: string | null
  /** For a provider that is many servers (Mastodon): the one this account lives on. */
  server?: string
}

/** What must survive from `beginAuthorization` to `completeAuthorization`. */
export interface PendingAuthorization {
  provider: string
  state: string
  codeVerifier: string
  nonce: string
  redirectUri: string
  scopes: string[]
  /** Unix seconds. */
  expiresAt: number
  /** The server the flow runs against, for a provider that is many (Mastodon); else `null`. */
  server: string | null
  /** The DPoP key the tokens will be bound to, for a provider that sets `dpop`; else `null`. */
  dpopKey: JsonWebKey | null
}

export interface OAuthProvider {
  readonly id: string
  /** Asked for when `beginAuthorization` is given none. */
  readonly scopes: readonly string[]
  /** Bound tokens (DPoP): `beginAuthorization` makes a key for the flow. */
  readonly dpop?: boolean
  /** On a provider from `forServer`: the server it is for, as the flow should remember it. */
  readonly server?: string
  /** Where to send the browser. Asynchronous for a provider that pushes the request first (PAR). */
  authorizationUrl(pending: PendingAuthorization, codeChallenge: string): URL | Promise<URL>
  /**
   * Exchanges the code, checks what came back, and says who it is. `params` is the whole
   * callback query, for a provider that checks more than the code (`iss`).
   */
  exchange(
    code: string,
    pending: PendingAuthorization,
    params?: URLSearchParams,
  ): Promise<CompletedAuthorization>
  /** Present when the provider issues refresh tokens. */
  refresh?(tokens: TokenSet): Promise<TokenSet>
  /**
   * Present when the provider is many servers that each run their own OAuth (Mastodon): the
   * provider for one server, which the user names. Begin and complete with what it returns.
   */
  forServer?(server: string, redirectUri: string): Promise<OAuthProvider>
}

export interface CompletedAuthorization {
  tokens: TokenSet
  identity: Identity
}

export type OAuthErrorCode =
  /** The user said no at the provider. */
  | 'denied'
  /** The callback's `state` does not match, or it belongs to another provider: not this flow. */
  | 'state_mismatch'
  /** The flow took longer than its time-to-live. */
  | 'expired'
  /** The provider refused the exchange, or answered with something that failed a check. */
  | 'provider_error'
  /** The server the user named is not a public host, or does not answer as a provider. */
  | 'bad_server'

/** A flow that failed for a reason the user can be told about. */
export class OAuthError extends Error {
  constructor(
    readonly code: OAuthErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'OAuthError'
  }
}

const now = () => Math.floor(Date.now() / 1000)

function randomString(): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)))
}

async function s256(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64UrlEncode(new Uint8Array(digest))
}

/**
 * Starts a flow: fresh `state`, PKCE verifier (S256) and OIDC `nonce`, and the URL to send
 * the browser to. Keep `pending` where only this browser can bring it back, such as a sealed
 * HttpOnly cookie, and pass it to `completeAuthorization`.
 */
export async function beginAuthorization(
  provider: OAuthProvider,
  options: {
    redirectUri: string
    scopes?: readonly string[]
    ttlSeconds?: number
    /** The server, when `provider` came from `forServer`. */
    server?: string
  },
): Promise<{ url: string; pending: PendingAuthorization }> {
  const pending: PendingAuthorization = {
    provider: provider.id,
    state: randomString(),
    codeVerifier: randomString(),
    nonce: randomString(),
    redirectUri: options.redirectUri,
    scopes: [...(options.scopes ?? provider.scopes)],
    expiresAt: now() + (options.ttlSeconds ?? 600),
    server: options.server ?? null,
    dpopKey: provider.dpop ? await newEs256Key() : null,
  }
  const url = await provider.authorizationUrl(pending, await s256(pending.codeVerifier))
  return { url: url.href, pending }
}

/**
 * Finishes a flow from the callback's query string: checks it is the flow `pending` started,
 * surfaces a refusal, exchanges the code. Throws `OAuthError` for anything the user should be
 * told about.
 */
export async function completeAuthorization(
  provider: OAuthProvider,
  pending: PendingAuthorization,
  params: URLSearchParams,
): Promise<CompletedAuthorization> {
  if (pending.provider !== provider.id) {
    throw new OAuthError('state_mismatch', 'This sign-in was started with another provider')
  }
  if (pending.expiresAt < now()) throw new OAuthError('expired', 'This sign-in took too long')
  const error = params.get('error')
  if (error === 'access_denied') throw new OAuthError('denied', 'Access was not granted')
  if (error) {
    throw new OAuthError('provider_error', params.get('error_description') ?? error)
  }
  const state = params.get('state')
  if (state === null || !sameString(state, pending.state)) {
    throw new OAuthError(
      'state_mismatch',
      'This sign-in does not match the one this browser started',
    )
  }
  const code = params.get('code')
  if (!code) throw new OAuthError('provider_error', 'The provider sent no code')
  return provider.exchange(code, pending, params)
}

function sameString(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** Checks a `PendingAuthorization` that came back from storage (`unseal` returns `unknown`). */
export function parsePendingAuthorization(raw: unknown): PendingAuthorization {
  if (typeof raw === 'object' && raw !== null) {
    const r = raw as Record<string, unknown>
    const { provider, state, codeVerifier, nonce, redirectUri, scopes, expiresAt } = r
    const server = r['server'] ?? null
    const dpopKey = r['dpopKey'] ?? null
    if (
      (typeof server === 'string' || server === null) &&
      (dpopKey === null || isEcJwk(dpopKey)) &&
      typeof provider === 'string' &&
      typeof state === 'string' &&
      typeof codeVerifier === 'string' &&
      typeof nonce === 'string' &&
      typeof redirectUri === 'string' &&
      Array.isArray(scopes) &&
      scopes.every((s) => typeof s === 'string') &&
      typeof expiresAt === 'number'
    ) {
      return {
        provider,
        state,
        codeVerifier,
        nonce,
        redirectUri,
        scopes,
        expiresAt,
        server,
        dpopKey,
      }
    }
  }
  throw new Error('Malformed pending authorization')
}

function isEcJwk(raw: unknown): raw is JsonWebKey {
  if (typeof raw !== 'object' || raw === null) return false
  const { kty, crv, x, y, d } = raw as Record<string, unknown>
  return (
    kty === 'EC' &&
    crv === 'P-256' &&
    typeof x === 'string' &&
    typeof y === 'string' &&
    typeof d === 'string'
  )
}

/** Checks a `TokenSet` that came back from storage (`unseal` returns `unknown`). */
export function parseTokenSet(raw: unknown): TokenSet {
  if (typeof raw === 'object' && raw !== null) {
    const { accessToken, refreshToken, expiresAt, scopes, dpop } = raw as Record<string, unknown>
    if (
      typeof accessToken === 'string' &&
      (typeof refreshToken === 'string' || refreshToken === null) &&
      (typeof expiresAt === 'number' || expiresAt === null) &&
      Array.isArray(scopes) &&
      scopes.every((s) => typeof s === 'string')
    ) {
      const tokens: TokenSet = { accessToken, refreshToken, expiresAt, scopes }
      if (dpop === undefined) return tokens
      if (typeof dpop === 'object' && dpop !== null) {
        const { key, issuer, clientId } = dpop as Record<string, unknown>
        if (isEcJwk(key) && typeof issuer === 'string' && typeof clientId === 'string') {
          return { ...tokens, dpop: { key, issuer, clientId } }
        }
      }
    }
  }
  throw new Error('Malformed token set')
}

/* ---------------------------------- sealing ---------------------------------- */

async function sealingKey(secret: string, context: string): Promise<CryptoKey> {
  if (secret.length < 32) {
    throw new Error('The sealing secret must be at least 32 characters (openssl rand -base64 32)')
  }
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    'HKDF',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(0),
      info: new TextEncoder().encode(context),
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/**
 * Encrypts and authenticates `value` (AES-256-GCM, a key derived from `secret` per
 * `context`). For a pending authorization in a cookie, or tokens kept in a database. The
 * `context` binds the result to its use: a value sealed as `'oauth-pending'` does not open as
 * `'tokens:<row id>'`, so a sealed blob copied elsewhere is useless.
 */
export async function seal(secret: string, context: string, value: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = new TextEncoder().encode(JSON.stringify(value))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(context) },
    await sealingKey(secret, context),
    data,
  )
  const out = new Uint8Array(iv.length + encrypted.byteLength)
  out.set(iv)
  out.set(new Uint8Array(encrypted), iv.length)
  return base64UrlEncode(out)
}

/**
 * Opens what `seal` made, or returns `null` when it was tampered with, sealed under another
 * secret or context, or is not a sealed value at all. Parse the result before using it.
 */
export async function unseal(secret: string, context: string, sealed: string): Promise<unknown> {
  const key = await sealingKey(secret, context)
  try {
    const bytes = base64UrlDecode(sealed)
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: bytes.slice(0, 12),
        additionalData: new TextEncoder().encode(context),
      },
      key,
      bytes.slice(12),
    )
    return JSON.parse(new TextDecoder().decode(decrypted)) as unknown
  } catch {
    return null
  }
}

/* --------------------------------- token calls -------------------------------- */

interface TokenResponse extends TokenSet {
  idToken: string | null
}

/**
 * Parses an RFC 6749 token response. Granted scopes are split on commas as well as spaces:
 * GitHub joins them with commas.
 */
function parseTokenResponse(raw: unknown, requested: readonly string[]): TokenResponse {
  if (typeof raw !== 'object' || raw === null) {
    throw new OAuthError('provider_error', 'The token response is not a JSON object')
  }
  const r = raw as Record<string, unknown>
  if (typeof r['error'] === 'string') {
    const description = r['error_description']
    throw new OAuthError(
      'provider_error',
      typeof description === 'string' ? description : r['error'],
    )
  }
  const accessToken = r['access_token']
  if (typeof accessToken !== 'string' || accessToken === '') {
    throw new OAuthError('provider_error', 'The token response has no access_token')
  }
  const scope = r['scope']
  const expiresIn = r['expires_in']
  return {
    accessToken,
    refreshToken: typeof r['refresh_token'] === 'string' ? r['refresh_token'] : null,
    expiresAt: typeof expiresIn === 'number' ? now() + expiresIn : null,
    scopes: typeof scope === 'string' ? scope.split(/[\s,]+/).filter(Boolean) : [...requested],
    idToken: typeof r['id_token'] === 'string' ? r['id_token'] : null,
  }
}

async function postForm(
  doFetch: typeof fetch,
  url: string,
  form: Record<string, string>,
): Promise<unknown> {
  const response = await doFetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams(form),
  })
  const body: unknown = await response.json().catch(() => null)
  // An error response still carries `error`: let the parser report it.
  if (!response.ok && (typeof body !== 'object' || body === null)) {
    throw new OAuthError('provider_error', `${url}: ${response.status}`)
  }
  return body
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null
}

/* ------------------------------- OpenID Connect ------------------------------- */

/**
 * Verifies an ID token (signature, issuer, audience, expiry) and its nonce, as `OAuthError`s.
 * `nonceRequired: false` is for a provider that does not echo the nonce (LinkedIn): one it
 * does send must still match.
 */
async function verifyIdToken(
  idToken: string,
  options: {
    jwksUrl: string
    issuer: readonly string[]
    audience: string
    label: string
    fetch: typeof fetch
    nonce: string
    nonceRequired: boolean
  },
): Promise<Record<string, unknown>> {
  let claims: Record<string, unknown>
  try {
    claims = await verifyJwt(idToken, options)
  } catch (error) {
    if (error instanceof JwtError) {
      throw new OAuthError('provider_error', `${options.label} ID token: ${error.reason}`)
    }
    throw error
  }
  const nonce = claims['nonce']
  if (nonce === undefined ? options.nonceRequired : nonce !== options.nonce) {
    throw new OAuthError('provider_error', `${options.label} ID token: wrong nonce`)
  }
  if (typeof claims['sub'] !== 'string' || claims['sub'] === '') {
    throw new OAuthError('provider_error', `${options.label} ID token: no subject`)
  }
  return claims
}

/** The identity in verified ID-token claims; the email only when `email_verified` says so. */
function oidcIdentity(provider: string, claims: Record<string, unknown>): Identity {
  const email = stringOrNull(claims['email'])
  const verified = claims['email_verified'] === true
  return {
    provider,
    subject: String(claims['sub']),
    email: email && verified ? email.toLowerCase() : null,
    name: stringOrNull(claims['name']),
    handle: null,
    avatarUrl: stringOrNull(claims['picture']),
  }
}

/* ----------------------------------- Google ----------------------------------- */

export interface GoogleOptions {
  clientId: string
  clientSecret: string
  /** Default `openid email profile`. Add an API's scope here to use the tokens for it. */
  scopes?: readonly string[]
  /**
   * Only accounts in this Google Workspace domain (`acme.com`). Sent as `hd` to pick the
   * account, and checked on the ID token, since the parameter alone is only a hint.
   */
  hostedDomain?: string
  /** Ask for a refresh token (`access_type=offline`, `prompt=consent`). Sign-in needs none. */
  offline?: boolean
  fetch?: typeof fetch
}

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com']

/** Google, over OpenID Connect: PKCE, `nonce`, and the ID token verified against Google's keys. */
export function google(options: GoogleOptions): OAuthProvider {
  const doFetch = options.fetch ?? ((input, init) => fetch(input, init))
  return {
    id: 'google',
    scopes: options.scopes ?? ['openid', 'email', 'profile'],
    authorizationUrl(pending, codeChallenge) {
      const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      const params: Record<string, string> = {
        response_type: 'code',
        client_id: options.clientId,
        redirect_uri: pending.redirectUri,
        scope: pending.scopes.join(' '),
        state: pending.state,
        nonce: pending.nonce,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        ...(options.hostedDomain ? { hd: options.hostedDomain } : {}),
        ...(options.offline ? { access_type: 'offline', prompt: 'consent' } : {}),
      }
      for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
      return url
    },
    async exchange(code, pending) {
      const response = parseTokenResponse(
        await postForm(doFetch, 'https://oauth2.googleapis.com/token', {
          grant_type: 'authorization_code',
          code,
          client_id: options.clientId,
          client_secret: options.clientSecret,
          redirect_uri: pending.redirectUri,
          code_verifier: pending.codeVerifier,
        }),
        pending.scopes,
      )
      if (!response.idToken) {
        throw new OAuthError('provider_error', 'Google sent no ID token: ask for the openid scope')
      }
      const claims = await verifyIdToken(response.idToken, {
        jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
        issuer: GOOGLE_ISSUERS,
        audience: options.clientId,
        label: 'Google',
        fetch: doFetch,
        nonce: pending.nonce,
        nonceRequired: true,
      })
      if (options.hostedDomain && claims['hd'] !== options.hostedDomain) {
        throw new OAuthError('denied', `Only ${options.hostedDomain} accounts can sign in`)
      }
      const { idToken: _idToken, ...tokens } = response
      return { tokens, identity: oidcIdentity('google', claims) }
    },
    async refresh(tokens) {
      if (!tokens.refreshToken) throw new Error('No refresh token: authorize with offline: true')
      const response = parseTokenResponse(
        await postForm(doFetch, 'https://oauth2.googleapis.com/token', {
          grant_type: 'refresh_token',
          refresh_token: tokens.refreshToken,
          client_id: options.clientId,
          client_secret: options.clientSecret,
        }),
        tokens.scopes,
      )
      // Google keeps the refresh token unless it says otherwise.
      return {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken ?? tokens.refreshToken,
        expiresAt: response.expiresAt,
        scopes: response.scopes,
      }
    },
  }
}

/* ---------------------------------- LinkedIn ---------------------------------- */

export interface LinkedInOptions {
  clientId: string
  clientSecret: string
  /**
   * Default `openid profile email` (the "Sign In with LinkedIn using OpenID Connect" product).
   * Add `w_member_social` ("Share on LinkedIn") to post on the member's behalf with the tokens.
   */
  scopes?: readonly string[]
  fetch?: typeof fetch
}

/**
 * LinkedIn, over OpenID Connect: the ID token verified against LinkedIn's keys. A web app
 * authenticates with its client secret (LinkedIn's PKCE is for native apps only), so the
 * challenge is not sent. Access tokens last 60 days; refresh tokens exist only for LinkedIn's
 * approved partners, so a member reconnects when one expires.
 */
export function linkedin(options: LinkedInOptions): OAuthProvider {
  const doFetch = options.fetch ?? ((input, init) => fetch(input, init))
  return {
    id: 'linkedin',
    scopes: options.scopes ?? ['openid', 'profile', 'email'],
    authorizationUrl(pending) {
      const url = new URL('https://www.linkedin.com/oauth/v2/authorization')
      const params: Record<string, string> = {
        response_type: 'code',
        client_id: options.clientId,
        redirect_uri: pending.redirectUri,
        scope: pending.scopes.join(' '),
        state: pending.state,
        nonce: pending.nonce,
      }
      for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
      return url
    },
    async exchange(code, pending) {
      const response = parseTokenResponse(
        await postForm(doFetch, 'https://www.linkedin.com/oauth/v2/accessToken', {
          grant_type: 'authorization_code',
          code,
          client_id: options.clientId,
          client_secret: options.clientSecret,
          redirect_uri: pending.redirectUri,
        }),
        pending.scopes,
      )
      if (!response.idToken) {
        throw new OAuthError(
          'provider_error',
          'LinkedIn sent no ID token: ask for the openid scope',
        )
      }
      const claims = await verifyIdToken(response.idToken, {
        jwksUrl: 'https://www.linkedin.com/oauth/openid/jwks',
        // The discovery document says the first; the documentation page, the second.
        issuer: ['https://www.linkedin.com/oauth', 'https://www.linkedin.com'],
        audience: options.clientId,
        label: 'LinkedIn',
        fetch: doFetch,
        nonce: pending.nonce,
        nonceRequired: false,
      })
      const { idToken: _idToken, ...tokens } = response
      return { tokens, identity: oidcIdentity('linkedin', claims) }
    },
  }
}

/* ---------------------------------- Mastodon ---------------------------------- */

/**
 * The host a person typed for their server, or `OAuthError('bad_server')`. Takes
 * `mastodon.social`, `https://mastodon.social/about` or a handle (`@ada@mastodon.social`);
 * gives the lowercased, punycoded hostname. Refuses what is not a public DNS name: IP
 * addresses, ports, credentials, single labels and local names. The Worker fetches this host,
 * so it is input to be distrusted.
 */
export function normalizeServer(input: string): string {
  let value = input.trim().toLowerCase()
  if (value.includes('@')) value = value.slice(value.lastIndexOf('@') + 1)
  value = value.replace(/^https?:\/\//, '').replace(/[/?#].*$/, '')
  const bad = () => new OAuthError('bad_server', `"${input.slice(0, 100)}" is not a server name`)
  if (!value || value.length > 253) throw bad()
  let url: URL
  try {
    url = new URL(`https://${value}`)
  } catch {
    throw bad()
  }
  const host = url.hostname
  if (
    url.port ||
    url.username ||
    url.password ||
    !host.includes('.') ||
    host.startsWith('[') ||
    /^[\d.]+$/.test(host) ||
    /(^|\.)(localhost|local|internal|lan|home|arpa)$/.test(host)
  ) {
    throw bad()
  }
  return host
}

const SERVER_TIMEOUT_MS = 10_000
const SERVER_MAX_BYTES = 256 * 1024

/** The settings for every call to a server someone named: a timeout, and no redirects. */
const guarded = (init: RequestInit = {}): RequestInit => ({
  ...init,
  redirect: 'manual',
  signal: AbortSignal.timeout(SERVER_TIMEOUT_MS),
})

/**
 * A call to a server someone named: a timeout, no redirects (a redirect could point
 * anywhere), and a cap on how much is read. Returns the status and the parsed body (or null).
 */
async function serverJson(
  doFetch: typeof fetch,
  url: string,
  init: RequestInit = {},
): Promise<{ status: number; body: unknown }> {
  let response: Response
  try {
    response = await doFetch(url, guarded(init))
  } catch (error) {
    throw new OAuthError('bad_server', `${new URL(url).host} did not answer: ${String(error)}`)
  }
  const { status, text } = await readCapped(response, url)
  let body: unknown = null
  try {
    body = JSON.parse(text) as unknown
  } catch {
    // Not JSON: the caller decides from the status.
  }
  return { status, body }
}

/** A response's text, refused past `SERVER_MAX_BYTES`. */
async function readCapped(
  response: Response,
  url: string,
): Promise<{ status: number; text: string }> {
  if (!response.body) return { status: response.status, text: '' }
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > SERVER_MAX_BYTES) {
      await reader.cancel()
      throw new OAuthError('bad_server', `${new URL(url).host} sent too much`)
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return { status: response.status, text: new TextDecoder().decode(bytes) }
}

/** What a server issued this app: kept so it registers once per server. */
export interface MastodonRegistration {
  clientId: string
  clientSecret: string
  authorizationEndpoint: string
  tokenEndpoint: string
  /** The server announced S256 PKCE (Mastodon 4.3+). */
  pkce: boolean
  /** The scopes registered, which every authorization asks for. */
  scopes: string[]
}

/** Where registrations are kept. `handleOAuth`'s package ships a D1 one (`mastodonRegistrations`). */
export interface MastodonRegistrations {
  get(key: string): Promise<MastodonRegistration | null>
  set(key: string, registration: MastodonRegistration): Promise<void>
}

export interface MastodonOptions {
  /** The app name a server shows on its authorize page. */
  appName: string
  /** Your app's homepage, shown with the name. */
  website?: string
  /**
   * Default `profile` (read only who signed in; servers before 4.3 get `read:accounts`). Add
   * `write:statuses` and `write:media` to post with the tokens.
   */
  scopes?: readonly string[]
  registrations: MastodonRegistrations
  fetch?: typeof fetch
}

/**
 * Mastodon, and servers that speak its API (GoToSocial, Akkoma, …). Every server runs its own
 * OAuth, so this provider is a factory: `forServer` discovers the server's endpoints, registers
 * the app there once (kept in `registrations`), and returns the provider for that server. The
 * identity is `<account id>@<server>`, with no email. Tokens do not expire.
 */
export function mastodon(options: MastodonOptions): OAuthProvider {
  const doFetch = options.fetch ?? ((input, init) => fetch(input, init))
  const wanted = options.scopes ?? ['profile']

  async function register(server: string, redirectUri: string): Promise<MastodonRegistration> {
    const meta = await serverJson(
      doFetch,
      `https://${server}/.well-known/oauth-authorization-server`,
    )
    const metadata =
      meta.status === 200 && typeof meta.body === 'object' && meta.body !== null
        ? (meta.body as Record<string, unknown>)
        : null
    const endpoint = (key: string, fallback: string) => {
      const value = metadata?.[key]
      if (typeof value !== 'string') return fallback
      // The token goes to this URL: it must be the server the user named.
      if (!URL.canParse(value) || new URL(value).host !== server) {
        throw new OAuthError('bad_server', `${server} points its ${key} at another host`)
      }
      return value
    }
    const supported = Array.isArray(metadata?.['scopes_supported'])
      ? (metadata['scopes_supported'] as unknown[])
      : []
    const methods = Array.isArray(metadata?.['code_challenge_methods_supported'])
      ? (metadata['code_challenge_methods_supported'] as unknown[])
      : []
    // `profile` came with 4.3; an older server reads the account with `read:accounts`.
    const scopes = wanted.map((scope) =>
      scope === 'profile' && !supported.includes('profile') ? 'read:accounts' : scope,
    )
    const created = await serverJson(doFetch, `https://${server}/api/v1/apps`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        client_name: options.appName,
        redirect_uris: redirectUri,
        scopes: scopes.join(' '),
        ...(options.website ? { website: options.website } : {}),
      }),
    })
    const app = typeof created.body === 'object' && created.body !== null ? created.body : null
    const clientId = app ? (app as Record<string, unknown>)['client_id'] : undefined
    const clientSecret = app ? (app as Record<string, unknown>)['client_secret'] : undefined
    if (
      created.status !== 200 ||
      typeof clientId !== 'string' ||
      typeof clientSecret !== 'string'
    ) {
      throw new OAuthError('bad_server', `${server} did not register the app (${created.status})`)
    }
    return {
      clientId,
      clientSecret,
      authorizationEndpoint: endpoint(
        'authorization_endpoint',
        `https://${server}/oauth/authorize`,
      ),
      tokenEndpoint: endpoint('token_endpoint', `https://${server}/oauth/token`),
      pkce: methods.includes('S256'),
      scopes,
    }
  }

  const factory: OAuthProvider = {
    id: 'mastodon',
    scopes: wanted,
    authorizationUrl() {
      throw new Error('mastodon(): call forServer(server, redirectUri) first')
    },
    async exchange() {
      throw new Error('mastodon(): call forServer(server, redirectUri) first')
    },
    async forServer(input, redirectUri) {
      const server = normalizeServer(input)
      const key = `${server} ${redirectUri} ${wanted.join(' ')}`
      let registration = await options.registrations.get(key)
      if (!registration) {
        registration = await register(server, redirectUri)
        await options.registrations.set(key, registration)
      }
      const app = registration
      return {
        id: 'mastodon',
        server,
        scopes: app.scopes,
        authorizationUrl(pending, codeChallenge) {
          const url = new URL(app.authorizationEndpoint)
          const params: Record<string, string> = {
            response_type: 'code',
            client_id: app.clientId,
            redirect_uri: pending.redirectUri,
            // Must be within what was registered: always the registered set.
            scope: app.scopes.join(' '),
            state: pending.state,
            ...(app.pkce ? { code_challenge: codeChallenge, code_challenge_method: 'S256' } : {}),
          }
          for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
          return url
        },
        async exchange(code, pending) {
          const { body: tokenBody } = await serverJson(doFetch, app.tokenEndpoint, {
            method: 'POST',
            headers: {
              'content-type': 'application/x-www-form-urlencoded',
              accept: 'application/json',
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              client_id: app.clientId,
              client_secret: app.clientSecret,
              redirect_uri: pending.redirectUri,
              scope: app.scopes.join(' '),
              ...(app.pkce ? { code_verifier: pending.codeVerifier } : {}),
            }),
          })
          const { idToken: _idToken, ...tokens } = parseTokenResponse(tokenBody, app.scopes)
          const me = await serverJson(
            doFetch,
            `https://${server}/api/v1/accounts/verify_credentials`,
            {
              headers: {
                authorization: `Bearer ${tokens.accessToken}`,
                accept: 'application/json',
              },
            },
          )
          const account =
            me.status === 200 && typeof me.body === 'object' && me.body !== null
              ? (me.body as Record<string, unknown>)
              : null
          const id = account?.['id']
          if (typeof id !== 'string' || !id) {
            throw new OAuthError('provider_error', `${server} did not say who signed in`)
          }
          const username = stringOrNull(account?.['username'])
          return {
            tokens,
            identity: {
              provider: 'mastodon',
              subject: `${id}@${server}`,
              email: null,
              name: stringOrNull(account?.['display_name']) ?? username,
              handle: username ? `@${username}@${server}` : null,
              avatarUrl: stringOrNull(account?.['avatar']),
              server,
            },
          }
        },
      }
    },
  }
  return factory
}

/* ---------------------------------- Bluesky ---------------------------------- */

const DID = /^did:(plc:[a-z2-7]{24}|web:[a-z0-9.-]+)$/

/** An https URL on a public host (a PDS or an authorization server a document names), as its origin. */
function publicOrigin(raw: unknown, what: string): string {
  if (typeof raw !== 'string' || !URL.canParse(raw)) {
    throw new OAuthError('bad_server', `No usable ${what}`)
  }
  const url = new URL(raw)
  if (url.protocol !== 'https:' || url.port || normalizeServer(url.host) !== url.hostname) {
    throw new OAuthError('bad_server', `The ${what} ${url.host} is not a public https host`)
  }
  return url.origin
}

/** A handle (`ada.bsky.social`, `@ada.example.com`) or a DID, as the user typed it. */
function parseAccountInput(input: string): { did: string } | { handle: string } {
  const value = input
    .trim()
    .replace(/^@/, '')
    .replace(/^at:\/\//, '')
  if (value.startsWith('did:')) {
    if (!DID.test(value))
      throw new OAuthError('bad_server', `"${value.slice(0, 100)}" is not a DID`)
    return { did: value }
  }
  return { handle: normalizeServer(value) }
}

async function resolveHandle(doFetch: typeof fetch, handle: string): Promise<string> {
  // DNS first, over HTTPS: a TXT record `_atproto.<handle>` holding `did=<did>`.
  const dns = await serverJson(
    doFetch,
    `https://cloudflare-dns.com/dns-query?name=_atproto.${handle}&type=TXT`,
    { headers: { accept: 'application/dns-json' } },
  )
  const answers =
    typeof dns.body === 'object' && dns.body !== null
      ? (dns.body as Record<string, unknown>)['Answer']
      : null
  const fromDns = (Array.isArray(answers) ? answers : [])
    .map((a) =>
      typeof a === 'object' && a !== null ? (a as Record<string, unknown>)['data'] : null,
    )
    .filter((d): d is string => typeof d === 'string')
    .map((d) => d.replace(/^"|"$/g, ''))
    .filter((d) => d.startsWith('did='))
    .map((d) => d.slice(4))
  if (fromDns.length === 1 && DID.test(fromDns[0]!)) return fromDns[0]!
  // Then HTTPS: the DID as the whole body of /.well-known/atproto-did.
  let response: Response
  try {
    response = await doFetch(`https://${handle}/.well-known/atproto-did`, guarded())
  } catch {
    throw new OAuthError('bad_server', `The handle ${handle} does not resolve`)
  }
  const { status, text } = await readCapped(response, `https://${handle}/`)
  const did = text.trim()
  if (status !== 200 || !DID.test(did)) {
    throw new OAuthError('bad_server', `The handle ${handle} does not resolve`)
  }
  return did
}

async function resolveDid(
  doFetch: typeof fetch,
  did: string,
): Promise<{ pds: string; handles: string[] }> {
  const url = did.startsWith('did:plc:')
    ? `https://plc.directory/${did}`
    : `https://${normalizeServer(did.slice('did:web:'.length))}/.well-known/did.json`
  const { status, body } = await serverJson(doFetch, url)
  const doc =
    status === 200 && typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>)
      : null
  if (!doc || doc['id'] !== did) throw new OAuthError('bad_server', `${did} has no DID document`)
  const services = Array.isArray(doc['service']) ? doc['service'] : []
  const pds = services
    .map((s) => (typeof s === 'object' && s !== null ? (s as Record<string, unknown>) : {}))
    .find(
      (s) =>
        typeof s['id'] === 'string' &&
        s['id'].endsWith('#atproto_pds') &&
        s['type'] === 'AtprotoPersonalDataServer',
    )
  const handles = (Array.isArray(doc['alsoKnownAs']) ? doc['alsoKnownAs'] : [])
    .filter((a): a is string => typeof a === 'string' && a.startsWith('at://'))
    .map((a) => a.slice('at://'.length).toLowerCase())
  return { pds: publicOrigin(pds?.['serviceEndpoint'], 'PDS'), handles }
}

interface AuthServer {
  issuer: string
  par: string
  authorize: string
  token: string
}

async function authServerOf(doFetch: typeof fetch, pds: string): Promise<AuthServer> {
  const resource = await serverJson(doFetch, `${pds}/.well-known/oauth-protected-resource`)
  const servers =
    typeof resource.body === 'object' && resource.body !== null
      ? (resource.body as Record<string, unknown>)['authorization_servers']
      : null
  const issuer = publicOrigin(Array.isArray(servers) ? servers[0] : null, 'authorization server')
  const meta = await serverJson(doFetch, `${issuer}/.well-known/oauth-authorization-server`)
  const m =
    typeof meta.body === 'object' && meta.body !== null
      ? (meta.body as Record<string, unknown>)
      : {}
  // The metadata must describe the server it came from: a mismatch is a server lying.
  if (m['issuer'] !== issuer) throw new OAuthError('bad_server', `${issuer} names another issuer`)
  const algs = m['dpop_signing_alg_values_supported']
  if (Array.isArray(algs) && !algs.includes('ES256')) {
    throw new OAuthError('bad_server', `${issuer} does not take ES256 DPoP proofs`)
  }
  // The code and the client's assertion go to these: they must be the issuer's own.
  const endpoint = (key: string) => {
    if (publicOrigin(m[key], key) !== issuer) {
      throw new OAuthError('bad_server', `${issuer} points its ${key} at another host`)
    }
    return String(m[key])
  }
  return {
    issuer,
    par: endpoint('pushed_authorization_request_endpoint'),
    authorize: endpoint('authorization_endpoint'),
    token: endpoint('token_endpoint'),
  }
}

/** The key Bluesky clients sign with: an ES256 private JWK, with the `kid` it is published under. */
export type BlueskyKey = JsonWebKey & { kid: string }

export interface BlueskyOptions {
  /**
   * A confidential client: your app's ES256 key (`private_key_jwt`). Sessions can last until
   * revoked; without it the app is a public client, and sessions end after two weeks.
   */
  privateKey?: BlueskyKey
  /**
   * Where your client metadata is served, on the app's origin (`blueskyClientMetadata`). Its
   * URL is the client id. Default `/oauth/client-metadata.json`. Unused in development: a
   * redirect to `127.0.0.1` makes it the loopback client, which needs no metadata.
   */
  clientMetadataPath?: string
  /** Default `atproto transition:generic`: post, and read the account's own records. */
  scopes?: readonly string[]
  fetch?: typeof fetch
}

const isLoopback = (url: URL) => url.hostname === '127.0.0.1' || url.hostname === '[::1]'

function blueskyClientId(
  options: BlueskyOptions,
  redirectUri: string,
  scopes: readonly string[],
): string {
  const redirect = new URL(redirectUri)
  if (redirect.hostname === 'localhost') {
    throw new Error(
      'Bluesky: open the app at http://127.0.0.1 in development, not localhost. Its development client may only redirect to 127.0.0.1.',
    )
  }
  if (isLoopback(redirect)) {
    const id = new URL('http://localhost')
    id.searchParams.set('redirect_uri', redirectUri)
    id.searchParams.set('scope', scopes.join(' '))
    return id.href
  }
  return new URL(options.clientMetadataPath ?? '/oauth/client-metadata.json', redirect.origin).href
}

/**
 * Bluesky (any AT Protocol account). Every account names its own server, so this is a
 * factory: `forServer` takes the handle or DID the user typed, resolves it to the account's
 * PDS and the authorization server behind it, and returns the provider for that account.
 *
 * The protocol is strict, and all of it is here: pushed authorization requests, PKCE, DPoP on
 * every request (tokens are bound to a key the flow makes, kept in `TokenSet.dpop`), the
 * callback's `iss`, and the check that the account the tokens name resolves back to the same
 * authorization server, so a hostile server cannot sign in as someone else's DID. The identity
 * is the DID, with the handle when it resolves back to the same DID; there is no email.
 */
export function bluesky(options: BlueskyOptions = {}): OAuthProvider {
  const doFetch = options.fetch ?? ((input, init) => fetch(input, init))
  const scopes = options.scopes ?? ['atproto', 'transition:generic']

  /** Client authentication for a token or PAR request: an assertion, or just the id. */
  async function clientAuth(clientId: string, issuer: string): Promise<Record<string, string>> {
    if (!options.privateKey || clientId.startsWith('http://localhost'))
      return { client_id: clientId }
    return {
      client_id: clientId,
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: await signEs256(
        options.privateKey,
        { kid: options.privateKey.kid },
        {
          iss: clientId,
          sub: clientId,
          aud: issuer,
          jti: crypto.randomUUID(),
          iat: now(),
          exp: now() + 60,
        },
      ),
    }
  }

  async function post(url: string, key: JsonWebKey, form: Record<string, string>) {
    let response: Response
    try {
      response = await dpopFetch(
        doFetch,
        key,
        url,
        guarded({
          method: 'POST',
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
            accept: 'application/json',
          },
          body: new URLSearchParams(form).toString(),
        }),
      )
    } catch (error) {
      throw new OAuthError(
        'provider_error',
        `${new URL(url).host} did not answer: ${String(error)}`,
      )
    }
    const { status, text } = await readCapped(response, url)
    let body: unknown = null
    try {
      body = JSON.parse(text) as unknown
    } catch {
      // reported below
    }
    return { status, body }
  }

  function boundTokens(
    body: unknown,
    key: JsonWebKey,
    issuer: string,
    clientId: string,
  ): TokenSet & { sub: unknown } {
    const { idToken: _idToken, ...tokens } = parseTokenResponse(body, scopes)
    const r = body as Record<string, unknown>
    if (typeof r['token_type'] !== 'string' || r['token_type'].toLowerCase() !== 'dpop') {
      throw new OAuthError('provider_error', 'Bluesky issued a token not bound to the key')
    }
    return { ...tokens, dpop: { key, issuer, clientId }, sub: r['sub'] }
  }

  const factory: OAuthProvider = {
    id: 'bluesky',
    scopes,
    dpop: true,
    authorizationUrl() {
      throw new Error('bluesky(): call forServer(handle, redirectUri) first')
    },
    async exchange() {
      throw new Error('bluesky(): call forServer(handle, redirectUri) first')
    },
    async forServer(input, redirectUri) {
      const account = parseAccountInput(input)
      const did = 'did' in account ? account.did : await resolveHandle(doFetch, account.handle)
      const doc = await resolveDid(doFetch, did)
      if ('handle' in account && !doc.handles.includes(account.handle)) {
        throw new OAuthError('bad_server', `${account.handle} and ${did} do not name each other`)
      }
      const server = await authServerOf(doFetch, doc.pds)
      const clientId = blueskyClientId(options, redirectUri, scopes)
      // The handle shown: one the DID document claims and that resolves back to the DID.
      let handle: string | null = 'handle' in account ? account.handle : null
      if (!handle && doc.handles[0]) {
        handle = await resolveHandle(doFetch, doc.handles[0]).then(
          (back) => (back === did ? doc.handles[0]! : null),
          () => null,
        )
      }
      return {
        id: 'bluesky',
        server: did,
        scopes,
        dpop: true,
        async authorizationUrl(pending, codeChallenge) {
          if (!pending.dpopKey) throw new Error('The flow has no DPoP key')
          const { status, body } = await post(server.par, pending.dpopKey, {
            response_type: 'code',
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            state: pending.state,
            redirect_uri: pending.redirectUri,
            scope: scopes.join(' '),
            login_hint: handle ?? did,
            ...(await clientAuth(clientId, server.issuer)),
          })
          const requestUri =
            typeof body === 'object' && body !== null
              ? (body as Record<string, unknown>)['request_uri']
              : null
          if ((status !== 201 && status !== 200) || typeof requestUri !== 'string') {
            const reason =
              typeof body === 'object' && body !== null
                ? (body as Record<string, unknown>)['error_description']
                : null
            throw new OAuthError(
              'provider_error',
              `${server.issuer} refused the request${typeof reason === 'string' ? `: ${reason}` : ` (${status})`}`,
            )
          }
          const url = new URL(server.authorize)
          url.searchParams.set('client_id', clientId)
          url.searchParams.set('request_uri', requestUri)
          return url
        },
        async exchange(code, pending, params) {
          if (params?.get('iss') !== server.issuer) {
            throw new OAuthError(
              'provider_error',
              'The callback came from another authorization server',
            )
          }
          if (!pending.dpopKey) throw new Error('The flow has no DPoP key')
          const { body } = await post(server.token, pending.dpopKey, {
            grant_type: 'authorization_code',
            code,
            redirect_uri: pending.redirectUri,
            code_verifier: pending.codeVerifier,
            ...(await clientAuth(clientId, server.issuer)),
          })
          const { sub, ...tokens } = boundTokens(body, pending.dpopKey, server.issuer, clientId)
          // The tokens must be for the account this flow resolved, whose DID document points at
          // the server that issued them (resolved fresh for this callback).
          if (sub !== did) {
            throw new OAuthError(
              'provider_error',
              `${server.issuer} issued tokens for another account`,
            )
          }
          return {
            tokens,
            identity: {
              provider: 'bluesky',
              subject: did,
              email: null,
              name: null,
              handle: handle ? `@${handle}` : null,
              avatarUrl: null,
              server: new URL(doc.pds).host,
            },
          }
        },
      }
    },
    async refresh(tokens) {
      if (!tokens.dpop || !tokens.refreshToken) throw new Error('Not a Bluesky session')
      const { key, issuer, clientId } = tokens.dpop
      const meta = await serverJson(
        doFetch,
        `${publicOrigin(issuer, 'issuer')}/.well-known/oauth-authorization-server`,
      )
      const m =
        typeof meta.body === 'object' && meta.body !== null
          ? (meta.body as Record<string, unknown>)
          : {}
      if (m['issuer'] !== issuer)
        throw new OAuthError('provider_error', `${issuer} names another issuer`)
      const tokenUrl = String(m['token_endpoint'])
      if (publicOrigin(tokenUrl, 'token endpoint') !== new URL(issuer).origin) {
        throw new OAuthError('provider_error', `${issuer} moved its token endpoint to another host`)
      }
      const { body } = await post(tokenUrl, key, {
        grant_type: 'refresh_token',
        refresh_token: tokens.refreshToken,
        ...(await clientAuth(clientId, issuer)),
      })
      const { sub: _sub, ...fresh } = boundTokens(body, key, issuer, clientId)
      return fresh
    },
  }
  return factory
}

/**
 * The client metadata document Bluesky's servers fetch from your client id
 * (`<origin><clientMetadataPath>`). Serve it as JSON at that path; with a `privateKey`, also
 * serve `blueskyJwks(privateKey)` at `jwksPath`.
 */
export function blueskyClientMetadata(options: {
  origin: string
  /** Every callback path the app uses: `/api/connections/bluesky/callback`, … */
  redirectPaths: readonly string[]
  clientName: string
  scopes?: readonly string[]
  clientMetadataPath?: string
  /** With a key, the app is a confidential client. */
  privateKey?: BlueskyKey
  jwksPath?: string
}): Record<string, unknown> {
  const origin = new URL(options.origin).origin
  return {
    client_id: new URL(options.clientMetadataPath ?? '/oauth/client-metadata.json', origin).href,
    client_name: options.clientName,
    client_uri: origin,
    application_type: 'web',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    redirect_uris: options.redirectPaths.map((path) => new URL(path, origin).href),
    scope: (options.scopes ?? ['atproto', 'transition:generic']).join(' '),
    dpop_bound_access_tokens: true,
    ...(options.privateKey
      ? {
          token_endpoint_auth_method: 'private_key_jwt',
          token_endpoint_auth_signing_alg: 'ES256',
          jwks_uri: new URL(options.jwksPath ?? '/oauth/jwks.json', origin).href,
        }
      : { token_endpoint_auth_method: 'none' }),
  }
}

/** The public half of your Bluesky key, as the JWKS `jwks_uri` serves. */
export function blueskyJwks(privateKey: BlueskyKey): { keys: Record<string, string>[] } {
  const { kty = '', crv = '', x = '', y = '' } = publicEs256(privateKey)
  return { keys: [{ kty, crv, x, y, kid: privateKey.kid, alg: 'ES256', use: 'sig' }] }
}

/** Reads a `BlueskyKey` from a secret (its JSON), or throws saying what is wrong. */
export function parseBlueskyKey(raw: string): BlueskyKey {
  let value: unknown
  try {
    value = JSON.parse(raw) as unknown
  } catch {
    throw new Error('The Bluesky key is not JSON: expected an ES256 private JWK with a kid')
  }
  if (isEcJwk(value) && typeof (value as { kid?: unknown }).kid === 'string') {
    return value as BlueskyKey
  }
  throw new Error('The Bluesky key must be an ES256 (P-256) private JWK with a kid')
}

/* ----------------------------------- Buffer ----------------------------------- */

export interface BufferOptions {
  /** An app client registered at https://publish.buffer.com/settings/api. */
  clientId: string
  /** A confidential client's secret; a public client has none (PKCE alone). */
  clientSecret?: string
  /** Default `posts:write posts:read account:read offline_access`. */
  scopes?: readonly string[]
  fetch?: typeof fetch
}

/** Buffer's GraphQL API, for a query that must succeed (no errors, data present). */
export async function bufferQuery(
  doFetch: typeof fetch,
  accessToken: string,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<{
  status: number
  data: Record<string, unknown> | null
  error: string | null
  /** GraphQL's `extensions.code` (`RATE_LIMIT_EXCEEDED`, `UNAUTHENTICATED`), when given. */
  code: string | null
  /** Seconds, from `Retry-After` on a 429. */
  retryAfter: number | null
}> {
  const response = await doFetch('https://api.buffer.com', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })
  const body: unknown = await response.json().catch(() => null)
  const r = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  // GraphQL reports most errors with a 200: the status alone says nothing.
  const errors = Array.isArray(r['errors']) ? r['errors'] : []
  const first = errors[0]
  const firstError =
    typeof first === 'object' && first !== null ? (first as Record<string, unknown>) : {}
  const message = typeof firstError['message'] === 'string' ? firstError['message'] : null
  const extensions = firstError['extensions']
  const code =
    typeof extensions === 'object' &&
    extensions !== null &&
    typeof (extensions as Record<string, unknown>)['code'] === 'string'
      ? String((extensions as Record<string, unknown>)['code'])
      : null
  const retry = Number(response.headers.get('retry-after'))
  const data =
    typeof r['data'] === 'object' && r['data'] !== null
      ? (r['data'] as Record<string, unknown>)
      : null
  return {
    status: response.status,
    data,
    error: message ?? (response.ok && data ? null : `Buffer answered ${response.status}`),
    code,
    retryAfter: Number.isFinite(retry) && retry > 0 ? retry : null,
  }
}

/**
 * Buffer, for connecting a user's Buffer so the app can post through it to the networks they
 * connected there (X, Instagram, TikTok, … as well as the ones this package posts to itself).
 * PKCE is mandatory; access tokens last an hour, and refresh tokens are single-use, replaced on
 * every refresh, which `connectionTokens`' lease makes safe. A connection is a Buffer
 * organization: its first one, whose channels the app can post to (`bufferChannels`).
 */
export function buffer(options: BufferOptions): OAuthProvider {
  const doFetch = options.fetch ?? ((input, init) => fetch(input, init))
  const client = (): Record<string, string> => ({
    client_id: options.clientId,
    ...(options.clientSecret ? { client_secret: options.clientSecret } : {}),
  })
  return {
    id: 'buffer',
    scopes: options.scopes ?? ['posts:write', 'posts:read', 'account:read', 'offline_access'],
    authorizationUrl(pending, codeChallenge) {
      const url = new URL('https://auth.buffer.com/auth')
      const params: Record<string, string> = {
        response_type: 'code',
        client_id: options.clientId,
        redirect_uri: pending.redirectUri,
        scope: pending.scopes.join(' '),
        state: pending.state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        prompt: 'consent',
      }
      for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
      return url
    },
    async exchange(code, pending) {
      const { idToken: _idToken, ...tokens } = parseTokenResponse(
        await postForm(doFetch, 'https://auth.buffer.com/token', {
          grant_type: 'authorization_code',
          code,
          redirect_uri: pending.redirectUri,
          code_verifier: pending.codeVerifier,
          ...client(),
        }),
        pending.scopes,
      )
      const { data, error } = await bufferQuery(
        doFetch,
        tokens.accessToken,
        'query { account { organizations { id name } } }',
      )
      const account = data?.['account']
      const orgs =
        typeof account === 'object' && account !== null
          ? (account as Record<string, unknown>)['organizations']
          : null
      const org = Array.isArray(orgs) ? orgs[0] : null
      const id =
        typeof org === 'object' && org !== null ? (org as Record<string, unknown>)['id'] : null
      if (typeof id !== 'string') {
        throw new OAuthError('provider_error', error ?? 'This Buffer account has no organization')
      }
      return {
        tokens,
        identity: {
          provider: 'buffer',
          subject: id,
          email: null,
          name: stringOrNull((org as Record<string, unknown>)['name']),
          handle: null,
          avatarUrl: null,
        },
      }
    },
    async refresh(tokens) {
      if (!tokens.refreshToken)
        throw new Error('No refresh token: ask for the offline_access scope')
      const fresh = parseTokenResponse(
        await postForm(doFetch, 'https://auth.buffer.com/token', {
          grant_type: 'refresh_token',
          refresh_token: tokens.refreshToken,
          ...client(),
        }),
        tokens.scopes,
      )
      return {
        accessToken: fresh.accessToken,
        refreshToken: fresh.refreshToken ?? tokens.refreshToken,
        expiresAt: fresh.expiresAt,
        scopes: fresh.scopes,
      }
    },
  }
}

/* ----------------------------------- GitHub ----------------------------------- */

export interface GitHubOptions {
  /** An OAuth App's client id and secret (its tokens do not expire). */
  clientId: string
  clientSecret: string
  /** Default `read:user user:email`; `user:email` is what makes a verified email readable. */
  scopes?: readonly string[]
  /** Offer to create a GitHub account on the authorize page. Default true (GitHub's own). */
  allowSignup?: boolean
  /** GitHub's API refuses requests without one. Default `cascivo-app`. */
  userAgent?: string
  fetch?: typeof fetch
}

/**
 * GitHub (an OAuth App): PKCE, then `/user` for the id, and `/user/emails` for an email only
 * when it is the primary one **and** verified. The email on the public profile is neither.
 */
export function github(options: GitHubOptions): OAuthProvider {
  const doFetch = options.fetch ?? ((input, init) => fetch(input, init))
  const api = async (path: string, accessToken: string): Promise<Response> =>
    doFetch(`https://api.github.com${path}`, {
      headers: {
        authorization: `Bearer ${accessToken}`,
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        'user-agent': options.userAgent ?? 'cascivo-app',
      },
    })

  return {
    id: 'github',
    scopes: options.scopes ?? ['read:user', 'user:email'],
    authorizationUrl(pending, codeChallenge) {
      const url = new URL('https://github.com/login/oauth/authorize')
      const params: Record<string, string> = {
        client_id: options.clientId,
        redirect_uri: pending.redirectUri,
        scope: pending.scopes.join(' '),
        state: pending.state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        ...(options.allowSignup === false ? { allow_signup: 'false' } : {}),
      }
      for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
      return url
    },
    async exchange(code, pending) {
      // GitHub answers a failed exchange with 200 and an `error` field: the parser catches it.
      const { idToken: _idToken, ...tokens } = parseTokenResponse(
        await postForm(doFetch, 'https://github.com/login/oauth/access_token', {
          client_id: options.clientId,
          client_secret: options.clientSecret,
          code,
          redirect_uri: pending.redirectUri,
          code_verifier: pending.codeVerifier,
        }),
        pending.scopes,
      )
      const userResponse = await api('/user', tokens.accessToken)
      if (!userResponse.ok) {
        throw new OAuthError('provider_error', `GitHub /user: ${userResponse.status}`)
      }
      const user: unknown = await userResponse.json()
      if (typeof user !== 'object' || user === null) {
        throw new OAuthError('provider_error', 'GitHub /user: not an object')
      }
      const { id, login, name, avatar_url } = user as Record<string, unknown>
      if (typeof id !== 'number') throw new OAuthError('provider_error', 'GitHub /user: no id')
      return {
        tokens,
        identity: {
          provider: 'github',
          subject: String(id),
          email: await verifiedPrimaryEmail(tokens.accessToken),
          name: stringOrNull(name),
          handle: stringOrNull(login),
          avatarUrl: stringOrNull(avatar_url),
        },
      }
    },
  }

  async function verifiedPrimaryEmail(accessToken: string): Promise<string | null> {
    const response = await api('/user/emails', accessToken)
    // Without the user:email scope this is a 403/404: no email, not a failed sign-in.
    if (!response.ok) return null
    const list: unknown = await response.json()
    if (!Array.isArray(list)) return null
    for (const entry of list) {
      if (typeof entry !== 'object' || entry === null) continue
      const { email, primary, verified } = entry as Record<string, unknown>
      if (primary === true && verified === true && typeof email === 'string') {
        return email.toLowerCase()
      }
    }
    return null
  }
}
