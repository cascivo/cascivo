// @vitest-environment node
import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import { currentUser, handleAuth, normalizeEmail, requireUser, SESSION_COOKIE } from './auth-server'
import type { AuthOptions } from './auth-server'
import type { Database, DbStatement } from './db'

/** D1's shape over a real SQLite database, as in db.test.ts. */
function d1(sqlite: DatabaseSync): Database {
  const statement = (sql: string, params: unknown[] = []): DbStatement => ({
    bind: (...values) => statement(sql, values),
    all: async () => ({ results: sqlite.prepare(sql).all(...(params as never[])) }),
    first: async () => sqlite.prepare(sql).get(...(params as never[])) ?? null,
    run: async () => sqlite.prepare(sql).run(...(params as never[])),
  })
  return {
    prepare: (sql) => statement(sql),
    batch: async (statements) => {
      sqlite.exec('BEGIN')
      try {
        const results = []
        for (const s of statements) results.push(await s.run())
        sqlite.exec('COMMIT')
        return results
      } catch (error) {
        sqlite.exec('ROLLBACK')
        throw error
      }
    },
  }
}

const ORIGIN = 'https://app.example'

function setup(options: Partial<AuthOptions> = {}) {
  const sqlite = new DatabaseSync(':memory:')
  const db = d1(sqlite)
  const sent: { email: string; url: string }[] = []
  const auth = handleAuth(db, {
    sendLink: async (email, url) => void sent.push({ email, url }),
    ...options,
  })
  const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
    auth(
      new Request(`${ORIGIN}/api/auth/${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: ORIGIN, ...headers },
        body: JSON.stringify(body),
      }),
    )
  /** Signs in and returns the session cookie header to send back. */
  const signIn = async (email = 'Ada@Example.com') => {
    await post('start', { email })
    const token = new URL(sent.at(-1)!.url).searchParams.get('token')!
    const response = await post('verify', { token })
    const cookie = response!.headers.get('set-cookie')!
    return { response, token, cookie: cookie.split(';')[0]! }
  }
  return { sqlite, db, auth, post, sent, signIn }
}

describe('handleAuth', () => {
  it('emails a link to the page, and the token signs in once', async () => {
    const { post, sent, signIn, db } = setup()
    const { response, token, cookie } = await signIn()
    expect(sent[0]).toMatchObject({ email: 'ada@example.com' })
    expect(new URL(sent[0]!.url).pathname).toBe('/signin/verify')
    expect(await response!.json()).toMatchObject({ user: { email: 'ada@example.com' } })
    const setCookie = response!.headers.get('set-cookie')!
    for (const part of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/'])
      expect(setCookie).toContain(part)
    expect(cookie.startsWith(`${SESSION_COOKIE}=`)).toBe(true)

    const request = new Request(`${ORIGIN}/api/x`, { headers: { cookie } })
    expect(await requireUser(db, request)).toMatchObject({ email: 'ada@example.com' })
    // The same link again: already used.
    const again = await post('verify', { token })
    expect(again!.status).toBe(400)
  })

  it('stores hashes, never the link or the session id', async () => {
    const { sqlite, signIn } = setup()
    const { token, cookie } = await signIn()
    const dump = JSON.stringify([
      sqlite.prepare('SELECT * FROM auth_links').all(),
      sqlite.prepare('SELECT * FROM sessions').all(),
    ])
    expect(dump).not.toContain(token)
    expect(dump).not.toContain(cookie.split('=')[1]!)
  })

  it('keeps one account per address, however it is typed', async () => {
    const { sqlite, signIn } = setup()
    await signIn('ada@example.com')
    await signIn('  ADA@example.com ')
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM users').get()).toEqual({ n: 1 })
  })

  it('refuses an expired link', async () => {
    const { post, sent } = setup({ linkTtlSeconds: 0 })
    await post('start', { email: 'ada@example.com' })
    const token = new URL(sent[0]!.url).searchParams.get('token')!
    expect((await post('verify', { token }))!.status).toBe(400)
  })

  it('answers /me, and signs out', async () => {
    const { auth, post, signIn } = setup()
    const { cookie } = await signIn()
    const me = await auth(new Request(`${ORIGIN}/api/auth/me`, { headers: { cookie } }))
    expect(await me!.json()).toMatchObject({ user: { email: 'ada@example.com' } })
    const out = await post('signout', {}, { cookie })
    expect(out!.headers.get('set-cookie')).toContain('Max-Age=0')
    const after = await auth(new Request(`${ORIGIN}/api/auth/me`, { headers: { cookie } }))
    expect(await after!.json()).toEqual({ user: null })
  })

  it('refuses cross-site writes, bad addresses and forged cookies', async () => {
    const { post, db } = setup()
    expect(
      (await post('start', { email: 'a@b.co' }, { origin: 'https://evil.example' }))!.status,
    ).toBe(403)
    expect((await post('start', { email: 'not an email' }))!.status).toBe(400)
    const forged = new Request(`${ORIGIN}/api/x`, {
      headers: { cookie: `${SESSION_COOKIE}=guess` },
    })
    expect(await currentUser(db, forged)).toBeNull()
    await expect(requireUser(db, forged)).rejects.toMatchObject({ status: 401 })
  })

  it('returns the link only when told to, for vite dev', async () => {
    const hidden = setup()
    expect(await (await hidden.post('start', { email: 'a@b.co' }))!.json()).toEqual({ sent: true })
    const shown = setup({ exposeLink: true })
    const body = (await (await shown.post('start', { email: 'a@b.co' }))!.json()) as {
      link: string
    }
    expect(body.link).toContain('/signin/verify?token=')
  })

  it('leaves other paths alone', async () => {
    const { auth } = setup()
    expect(await auth(new Request(`${ORIGIN}/api/customers`))).toBeNull()
    expect(await auth(new Request(`${ORIGIN}/api/auth/unknown`))).toBeNull()
  })
})

describe('normalizeEmail', () => {
  it('lowercases and trims, and refuses header-breaking input', () => {
    expect(normalizeEmail(' A@B.Co ')).toBe('a@b.co')
    expect(() => normalizeEmail('a@b.co\r\nBcc: x@y.z')).toThrow()
    expect(() => normalizeEmail(42)).toThrow()
  })
})
