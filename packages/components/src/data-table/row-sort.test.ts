import { describe, expect, it } from 'vitest'
import { sortRows } from './row-sort'

describe('sortRows', () => {
  it('sorts numbers numerically, both directions', () => {
    const rows = [{ n: 10 }, { n: 9 }, { n: 100 }, { n: -1 }]
    expect(sortRows(rows, (r) => r.n, 'asc').map((r) => r.n)).toEqual([-1, 9, 10, 100])
    expect(sortRows(rows, (r) => r.n, 'desc').map((r) => r.n)).toEqual([100, 10, 9, -1])
  })

  it('sorts strings with locale collation, like localeCompare did', () => {
    const rows = ['b', 'a', 'B', 'ä', 'A'].map((s) => ({ s }))
    const expected = [...rows].sort((x, y) => x.s.localeCompare(y.s)).map((r) => r.s)
    expect(sortRows(rows, (r) => r.s, 'asc').map((r) => r.s)).toEqual(expected)
  })

  it('is stable: ties keep their original order, in both directions', () => {
    const rows = [
      { k: 'x', i: 0 },
      { k: 'y', i: 1 },
      { k: 'x', i: 2 },
      { k: 'y', i: 3 },
    ]
    expect(sortRows(rows, (r) => r.k, 'asc').map((r) => r.i)).toEqual([0, 2, 1, 3])
    expect(sortRows(rows, (r) => r.k, 'desc').map((r) => r.i)).toEqual([1, 3, 0, 2])
  })

  it('treats null and undefined as the empty string', () => {
    const rows = [{ v: 'b' }, { v: null }, { v: 'a' }, { v: undefined }]
    expect(sortRows(rows, (r) => r.v, 'asc').map((r) => r.v)).toEqual([null, undefined, 'a', 'b'])
  })

  it('falls back to string collation when a numeric column has a stray string', () => {
    const rows = [{ v: 10 }, { v: 'n/a' }, { v: 9 }]
    expect(sortRows(rows, (r) => r.v, 'asc').map((r) => r.v)).toEqual([10, 9, 'n/a'])
  })

  it('returns a copy and leaves the input untouched', () => {
    const rows = [{ n: 2 }, { n: 1 }]
    const out = sortRows(rows, (r) => r.n, 'asc')
    expect(out).not.toBe(rows)
    expect(rows.map((r) => r.n)).toEqual([2, 1])
    expect(sortRows([], (r: { n: number }) => r.n, 'asc')).toEqual([])
    expect(sortRows([{ n: 1 }], (r) => r.n, 'asc')).toEqual([{ n: 1 }])
  })
})
