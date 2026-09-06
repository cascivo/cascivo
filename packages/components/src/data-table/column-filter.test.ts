import { describe, expect, it } from 'vitest'
import {
  applyColumnFilters,
  countActiveFilters,
  facetValues,
  isFilterActive,
  matchesFilter,
  numericExtent,
} from './column-filter'

const rows = [
  { name: 'Ada', city: 'London', age: 36 },
  { name: 'Grace', city: 'New York', age: 85 },
  { name: 'Linus', city: 'Helsinki', age: 28 },
  { name: 'Margaret', city: 'London', age: 42 },
  { name: 'Barbara', city: 'London', age: null },
]
const valueOf = (row: (typeof rows)[number], key: string) => row[key as keyof typeof row]

describe('isFilterActive / countActiveFilters', () => {
  it('treats blank text, an empty set and an open range as inactive', () => {
    expect(isFilterActive({ kind: 'text', value: '  ' })).toBe(false)
    expect(isFilterActive({ kind: 'select', values: [] })).toBe(false)
    expect(isFilterActive({ kind: 'range' })).toBe(false)
    expect(isFilterActive(undefined)).toBe(false)
    expect(isFilterActive({ kind: 'text', value: 'a' })).toBe(true)
    expect(isFilterActive({ kind: 'range', max: 3 })).toBe(true)
    expect(
      countActiveFilters({
        a: { kind: 'text', value: '' },
        b: { kind: 'select', values: ['x'] },
        c: { kind: 'range', min: 1 },
      }),
    ).toBe(2)
  })
})

describe('matchesFilter', () => {
  it('matches text case-insensitively as a substring', () => {
    expect(matchesFilter('Helsinki', { kind: 'text', value: 'SINK' })).toBe(true)
    expect(matchesFilter('Helsinki', { kind: 'text', value: 'oslo' })).toBe(false)
    expect(matchesFilter(null, { kind: 'text', value: 'x' })).toBe(false)
  })
  it('matches select against the stringified value', () => {
    expect(matchesFilter(42, { kind: 'select', values: ['42'] })).toBe(true)
    expect(matchesFilter('London', { kind: 'select', values: ['Paris'] })).toBe(false)
  })
  it('matches an inclusive numeric range and rejects non-numbers', () => {
    expect(matchesFilter(42, { kind: 'range', min: 42, max: 42 })).toBe(true)
    expect(matchesFilter('7', { kind: 'range', min: 5 })).toBe(true)
    expect(matchesFilter(4, { kind: 'range', min: 5 })).toBe(false)
    expect(matchesFilter(null, { kind: 'range', min: 5 })).toBe(false)
  })
})

describe('applyColumnFilters', () => {
  it('returns the same array when no filter is active', () => {
    expect(applyColumnFilters(rows, {}, valueOf)).toBe(rows)
    expect(applyColumnFilters(rows, { name: { kind: 'text', value: '' } }, valueOf)).toBe(rows)
  })
  it('ANDs the active filters and preserves order', () => {
    const out = applyColumnFilters(
      rows,
      { city: { kind: 'select', values: ['London'] }, age: { kind: 'range', min: 40 } },
      valueOf,
    )
    expect(out.map((r) => r.name)).toEqual(['Margaret'])
  })
})

describe('facetValues', () => {
  it('counts distinct values, most frequent first, ties by collation', () => {
    expect(facetValues(rows, (r) => r.city)).toEqual([
      { value: 'London', count: 3 },
      { value: 'Helsinki', count: 1 },
      { value: 'New York', count: 1 },
    ])
  })
  it('stringifies null as the empty value', () => {
    expect(facetValues(rows, (r) => r.age).find((f) => f.value === '')).toEqual({
      value: '',
      count: 1,
    })
  })
})

describe('numericExtent', () => {
  it('skips blanks and non-numbers', () => {
    expect(numericExtent(rows, (r) => r.age)).toEqual({ min: 28, max: 85 })
    expect(numericExtent(rows, (r) => r.name)).toBeUndefined()
  })
})
