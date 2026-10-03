import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAuth } from './auth'

/** Answers `/api/auth/me` and `/api/auth/oauth` like the Worker would. */
function stubWorker(me: unknown, providers: unknown = ['github', 'google']) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => Response.json(url.endsWith('/me') ? { user: me } : { providers })),
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('createAuth', () => {
  it('takes a user without an email (signed in with a provider that shares none)', async () => {
    stubWorker({ id: 'u1', email: null })
    const auth = createAuth()
    await auth.refresh()
    expect(auth.user.value).toEqual({ id: 'u1', email: null })
  })

  it('lists the providers, and refuses a malformed list', async () => {
    stubWorker(null)
    expect(await createAuth().providers()).toEqual(['github', 'google'])
    stubWorker(null, [1])
    await expect(createAuth().providers()).rejects.toThrow(/Malformed/)
  })

  it('links to the Worker route, coming back to this page by default', () => {
    stubWorker(null)
    window.history.replaceState(null, '', '/billing?plan=pro')
    const auth = createAuth()
    expect(auth.signInUrl('github')).toBe('/api/auth/oauth/github?returnTo=%2Fbilling%3Fplan%3Dpro')
    expect(auth.signInUrl('google', '/account')).toBe('/api/auth/oauth/google?returnTo=%2Faccount')
  })
})
