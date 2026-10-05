import { describe, expect, it } from 'vitest'
import { parseMatrix, probeUrls } from './email.js'

const feature = {
  slug: 'css-display-flex',
  title: 'flex',
  category: 'css',
  stats: { outlook: { windows: { 2019: 'n' } } },
}

describe('parseMatrix', () => {
  it('reads a well-formed payload', () => {
    const data = parseMatrix(
      { api_version: '1', last_update_date: '2026-09-01', data: [feature] },
      'test',
    )
    expect(data.api_version).toBe('1')
    expect(data.data).toHaveLength(1)
    expect(data.data[0]?.slug).toBe('css-display-flex')
  })

  it('coerces the soft fields rather than rejecting the file', () => {
    // An upstream addition or a dropped optional must not break the command.
    const data = parseMatrix({ data: [{ slug: 'x', stats: {} }] }, 'test')
    expect(data.data[0]).toMatchObject({ slug: 'x', title: 'x', category: 'unknown' })
    expect(data.api_version).toBe('unknown')
    expect(data.data[0]).not.toHaveProperty('keywords')
  })

  it('names the source when the payload is not a matrix at all', () => {
    // It arrives from the network or a cache file, so "unusable" has to say which one.
    expect(() => parseMatrix({ nope: true }, 'https://example.test/data.json')).toThrow(
      /https:\/\/example\.test\/data\.json.*no `data` array/s,
    )
  })

  it('rejects the structural failures that would crash indexFeatures', () => {
    for (const [raw, why] of [
      [null, /not a JSON object/],
      ['a string', /not a JSON object/],
      [{ data: [] }, /`data` is empty/],
      [{ data: [{ title: 'no slug', stats: {} }] }, /data\[0\] has no `slug`/],
      [{ data: [{ slug: 'x' }] }, /data\[0\] \(x\) has no `stats`/],
    ] as const) {
      expect(() => parseMatrix(raw, 'test'), String(why)).toThrow(why)
    }
  })
})

describe('probeUrls', () => {
  function fake(statuses: Record<string, number | Error>, seen: string[] = []): typeof fetch {
    return (async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input)
      seen.push(`${init?.method} ${url}`)
      const status = statuses[url]
      if (status instanceof Error) throw status
      return new Response(null, { status: status ?? 200 })
    }) as typeof fetch
  }

  it('reports nothing for URLs that answer with a success', async () => {
    expect(await probeUrls(['https://a.io', 'https://b.io'], fake({}))).toEqual(new Map())
  })

  it('reports a 4xx/5xx and an unreachable host, naming why', async () => {
    const failures = await probeUrls(
      ['https://a.io/gone', 'https://b.io/down', 'https://c.io/ok'],
      fake({ 'https://a.io/gone': 404, 'https://b.io/down': new Error('getaddrinfo ENOTFOUND') }),
    )
    expect([...failures].sort()).toEqual([
      ['https://a.io/gone', 'answered 404'],
      ['https://b.io/down', 'could not be reached: getaddrinfo ENOTFOUND'],
    ])
  })

  it('retries a refused HEAD as GET before reporting', async () => {
    let calls = 0
    const headRefused = (async (_: string | URL | Request, init?: RequestInit) => {
      calls += 1
      return new Response(null, { status: init?.method === 'HEAD' ? 405 : 200 })
    }) as typeof fetch
    expect(await probeUrls(['https://a.io'], headRefused)).toEqual(new Map())
    expect(calls).toBe(2)
  })

  it('requests each URL once, however often it appears', async () => {
    const seen: string[] = []
    await probeUrls(['https://a.io', 'https://a.io', 'https://a.io'], fake({}, seen))
    expect(seen).toEqual(['HEAD https://a.io'])
  })
})
