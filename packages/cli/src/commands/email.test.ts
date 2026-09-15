import { describe, expect, it } from 'vitest'
import { parseMatrix } from './email.js'

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
