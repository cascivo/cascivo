import { describe, expect, it, vi } from 'vitest'
import { createRowSearch } from './row-search'

interface Person {
  name: string
  city: string
}
const people: Person[] = [
  { name: 'Ada Lovelace', city: 'London' },
  { name: 'Grace Hopper', city: 'New York' },
  { name: 'Linus Torvalds', city: 'Helsinki' },
  { name: 'Margaret Hamilton', city: 'Paoli' },
]
const hay = (p: Person) => `${p.name}\u0000${p.city}\u0000`.toLowerCase()

describe('createRowSearch', () => {
  it('matches a lower-cased substring in any column, preserving order', () => {
    const search = createRowSearch(hay)
    expect(search.filter(people, 'hop')).toEqual([people[1]])
    expect(search.filter(people, 'paoli')).toEqual([people[3]])
    expect(search.filter(people, 'a')).toEqual(people)
    expect(search.filter(people, 'zzz')).toEqual([])
  })

  it('returns the rows themselves for an empty query', () => {
    const search = createRowSearch(hay)
    expect(search.filter(people, '')).toBe(people)
  })

  it('does not match across the column boundary', () => {
    const search = createRowSearch(hay)
    expect(search.filter(people, 'lovelacelondon')).toEqual([])
    expect(search.filter(people, 'lovelace london')).toEqual([])
  })

  it('narrows an extended query from the previous result, with identical output', () => {
    const rows = Array.from({ length: 5000 }, (_, i) => ({
      name: `Person ${i}`,
      city: `City ${i % 7}`,
    }))
    const spy = vi.fn(hay)
    const search = createRowSearch(spy)
    const fresh = createRowSearch(hay)
    let out: readonly (typeof rows)[number][] = []
    for (const q of ['p', 'pe', 'per', 'person', 'person ', 'person 1'])
      out = search.filter(rows, q)
    expect(out.length).toBe(1111) // 1, 10–19, 100–199, 1000–1999
    // Extending the query re-tests only the previous result, never all 5,000 rows again.
    const before = spy.mock.calls.length
    out = search.filter(rows, 'person 12')
    expect(spy.mock.calls.length - before).toBe(1111)
    expect(out).toEqual(fresh.filter(rows, 'person 12'))
    expect(out.length).toBe(111) // 12, 120–129, 1200–1299
    // Backspacing (a shorter query) starts over and is still right.
    expect(search.filter(rows, 'person 1')).toEqual(fresh.filter(rows, 'person 1'))
    // A different query of the same length is not treated as a narrowing.
    expect(search.filter(rows, 'person 2')).toEqual(fresh.filter(rows, 'person 2'))
  })

  it('starts over when the base rows change, so a re-sort cannot leak stale order', () => {
    const search = createRowSearch(hay)
    const asc = [...people]
    const desc = [...people].reverse()
    expect(search.filter(asc, 'a')).toEqual(asc)
    expect(search.filter(desc, 'ad')).toEqual([people[0]])
    expect(search.filter(desc, 'a')).toEqual(desc)
  })

  it('serves a repeated query from memory', () => {
    const search = createRowSearch(hay)
    const a = search.filter(people, 'lo')
    expect(search.filter(people, 'lo')).toBe(a)
  })
  it('primes haystacks ahead of a query, in bounded chunks', () => {
    const spy = vi.fn(hay)
    const search = createRowSearch(spy)
    expect(search.prime(people, 0, 3)).toBe(3)
    expect(spy).toHaveBeenCalledTimes(3)
    expect(search.prime(people, 3, 100)).toBe(people.length)
    expect(spy).toHaveBeenCalledTimes(people.length)
  })
})
