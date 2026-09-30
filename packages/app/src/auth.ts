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
 * ```
 */

export interface User {
  id: string
  email: string
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
}

function parseUser(raw: unknown): User | null {
  if (raw === null) return null
  if (typeof raw === 'object') {
    const { id, email } = raw as Record<string, unknown>
    if (typeof id === 'string' && typeof email === 'string') return { id, email }
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
  }
  auth.refresh().catch((error: unknown) => {
    console.warn('[cascivo/auth] could not check the session:', error)
    user.value = null
  })
  return auth
}
