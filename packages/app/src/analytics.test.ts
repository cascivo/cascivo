// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { defineMetrics, numberField, queryAnalytics, stringField } from './analytics'
import type { AnalyticsDataset } from './analytics'

const usage = defineMetrics({
  dataset: 'app_usage',
  blobs: ['path', 'method'],
  doubles: ['status', 'duration_ms'],
  index: 'path',
})

function recorder() {
  const points: Parameters<AnalyticsDataset['writeDataPoint']>[0][] = []
  return {
    points,
    binding: { writeDataPoint: (p) => void points.push(p) } satisfies AnalyticsDataset,
  }
}

describe('defineMetrics', () => {
  it('writes named fields in their positions, with the index blob as the index', () => {
    const { points, binding } = recorder()
    usage.write(binding, { method: 'POST', path: '/api/notes', duration_ms: 12.5, status: 201 })
    expect(points).toEqual([
      { blobs: ['/api/notes', 'POST'], doubles: [201, 12.5], indexes: ['/api/notes'] },
    ])
  })

  it('fills a missing field and cuts an oversized blob', () => {
    const { points, binding } = recorder()
    usage.write(binding, { path: 'x'.repeat(5000), duration_ms: Number.NaN })
    expect(points[0]!.blobs![0]).toHaveLength(1024)
    expect(points[0]!.blobs![1]).toBe('')
    expect(points[0]!.doubles).toEqual([0, 0])
    expect(points[0]!.indexes![0]).toHaveLength(96)
  })

  it('writes queries against names, not positions', () => {
    expect(usage.column('duration_ms')).toBe('double2')
    expect(
      usage.sql(
        'SELECT {path} AS path, SUM(_sample_interval) AS n FROM {dataset} WHERE {status} >= 500',
      ),
    ).toBe('SELECT blob1 AS path, SUM(_sample_interval) AS n FROM app_usage WHERE double1 >= 500')
    expect(() => usage.sql('SELECT {country} FROM {dataset}')).toThrow(/Unknown column \{country\}/)
  })

  it.each([
    ['a dataset that is not an identifier', { dataset: 'app-usage; DROP', blobs: [], doubles: [] }],
    [
      'too many blobs',
      { dataset: 'd', blobs: Array.from({ length: 21 }, (_, i) => `b${i}`), doubles: [] },
    ],
    ['a name used twice', { dataset: 'd', blobs: ['a'], doubles: ['a'] }],
    ['an invalid column name', { dataset: 'd', blobs: ['has space'], doubles: [] }],
  ])('refuses %s', (_, schema) => {
    expect(() => defineMetrics(schema)).toThrow()
  })
})

describe('queryAnalytics', () => {
  it('posts the SQL with the token and parses each row', async () => {
    const seen: { url: string; auth: string | null; body: string }[] = []
    const fakeFetch = (async (url: string, init: RequestInit) => {
      seen.push({
        url,
        auth: new Headers(init.headers).get('authorization'),
        body: String(init.body),
      })
      return Response.json({ meta: [], data: [{ path: '/a', n: '42' }], rows: 1 })
    }) as typeof fetch
    const rows = await queryAnalytics(
      { accountId: 'acc 1', apiToken: 'secret', fetch: fakeFetch },
      'SELECT 1',
      (row) => ({ path: stringField(row, 'path'), n: numberField(row, 'n') }),
    )
    expect(rows).toEqual([{ path: '/a', n: 42 }])
    expect(seen[0]).toEqual({
      url: 'https://api.cloudflare.com/client/v4/accounts/acc%201/analytics_engine/sql',
      auth: 'Bearer secret',
      body: 'SELECT 1',
    })
  })

  it('fails with the API error, and on a body without rows', async () => {
    const failing = (async () =>
      new Response('Authentication error', { status: 401 })) as typeof fetch
    await expect(
      queryAnalytics({ accountId: 'a', apiToken: 't', fetch: failing }, 'SELECT 1', (r) => r),
    ).rejects.toThrow('Analytics Engine query failed (401): Authentication error')
    const noRows = (async () => Response.json({ meta: [] })) as typeof fetch
    await expect(
      queryAnalytics({ accountId: 'a', apiToken: 't', fetch: noRows }, 'SELECT 1', (r) => r),
    ).rejects.toThrow('no rows')
  })

  it('refuses a row field of the wrong type', () => {
    expect(() => numberField({ n: 'many' }, 'n')).toThrow()
    expect(() => stringField({ path: 1 }, 'path')).toThrow()
  })
})
