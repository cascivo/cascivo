import { signal } from '@cascivo/core'
import type { ReadonlySignal } from '@cascivo/core'

/**
 * `@cascivo/app/auth` — the browser side of `handleAuth` (`@cascivo/app/auth-server`).
 *
 * ```ts
 * export const auth = createAuth()
 * auth.user.value       // undefined while loading, null when signed out, { id, email } when in
 * await auth.start('ada@example.com')   // emails a link
 * await auth.verify(token)              // on the page the link opens
 * await auth.signOut()
 * // With handleOAuth (`@cascivo/app/oauth-server`) as well:
 * await auth.providers()                  // ['github', 'google']
 * <a href={auth.signInUrl('github')}>     // a plain link: works before hydration too
 * ```
 */

export interface User {
  id: string
  /** `null` for someone who signed in with a provider that shares no verified address. */
  email: string | null
}

export interface Auth {
  /** `undefined` until the first check answers, then the user or `null`. */
  readonly user: ReadonlySignal<User | null | undefined>
  /** Asks the Worker whether this browser is signed in. Runs once on creation. */
  refresh(): Promise<void>
  /** Emails a sign-in link. `link` is set only when the Worker exposes it (`vite dev`). */
  start(email: string): Promise<{ link: string | null }>
  /** Signs in with the token from the link. */
  verify(token: string): Promise<User>
  signOut(): Promise<void>
  /** The OAuth providers the Worker offers (`handleOAuth`), in its order. */
  providers(): Promise<string[]>
  /**
   * Where a "Sign in with …" link points: the Worker redirects to the provider and, once signed
   * in, back to `returnTo` (a path on this site; default the current page). `server` names the
   * user's server for a provider that is many (`mastodon.social` for Mastodon).
   */
  signInUrl(provider: string, returnTo?: string, server?: string): string
}

function parseUser(raw: unknown): User | null {
  if (raw === null) return null
  if (typeof raw === 'object') {
    const { id, email } = raw as Record<string, unknown>
    if (typeof id === 'string' && (typeof email === 'string' || email === null))
      return { id, email }
  }
  throw new Error('Malformed user')
}

async function call(url: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    ...init,
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
  })
  const body: unknown = await response.json().catch(() => null)
  if (typeof body !== 'object' || body === null) {
    throw new Error(`${url}: ${response.status} without a JSON body`)
  }
  const record = body as Record<string, unknown>
  if (!response.ok) {
    throw new Error(
      typeof record['error'] === 'string' ? record['error'] : `${url}: ${response.status}`,
    )
  }
  return record
}

export function createAuth(basePath = '/api/auth'): Auth {
  const user = signal<User | null | undefined>(undefined)
  const post = (path: string, body: unknown) =>
    call(`${basePath}/${path}`, { method: 'POST', body: JSON.stringify(body) })

  const auth: Auth = {
    user,
    async refresh() {
      user.value = parseUser((await call(`${basePath}/me`))['user'])
    },
    async start(email) {
      const { link } = await post('start', { email })
      return { link: typeof link === 'string' ? link : null }
    },
    async verify(token) {
      const signedIn = parseUser((await post('verify', { token }))['user'])
      if (!signedIn) throw new Error('Sign-in failed')
      user.value = signedIn
      return signedIn
    },
    async signOut() {
      await post('signout', {})
      user.value = null
    },
    async providers() {
      const { providers } = await call(`${basePath}/oauth`)
      if (!Array.isArray(providers) || !providers.every((p) => typeof p === 'string')) {
        throw new Error('Malformed provider list')
      }
      return providers
    },
    signInUrl(provider, returnTo, server) {
      const back = returnTo ?? `${location.pathname}${location.search}`
      const query = new URLSearchParams({ returnTo: back, ...(server ? { server } : {}) })
      return `${basePath}/oauth/${encodeURIComponent(provider)}?${query}`
    },
  }
  auth.refresh().catch((error: unknown) => {
    console.warn('[cascivo/auth] could not check the session:', error)
    user.value = null
  })
  return auth
}
