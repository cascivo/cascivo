import { describe, expect, it } from 'vitest'
import {
  __lineIndexStats,
  __resetLineIndexStats,
  createLineIndex,
  createLineIndexCache,
} from './line-index.ts'

/** The scanning implementation the index replaces — the oracle for the property check. */
function naive(text: string, offset: number): { line: number; col: number } {
  let line = 0
  let lineStart = 0
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === '\n') {
      line++
      lineStart = i + 1
    }
  }
  return { line, col: offset - lineStart }
}

describe('createLineIndex', () => {
  it('counts the empty document as one line', () => {
    const index = createLineIndex('')
    expect(index.count).toBe(1)
    expect(index.lineAt(0)).toBe(0)
    expect(index.toArray()).toEqual([''])
  })

  it('counts a trailing newline as opening a final empty line', () => {
    expect(createLineIndex('a\n').count).toBe(2)
    expect(createLineIndex('a\nb').count).toBe(2)
  })

  it('agrees with a scanning lookup at every offset', () => {
    const text = 'alpha\n\nbeta gamma\ndelta\n'
    const index = createLineIndex(text)
    for (let offset = 0; offset <= text.length; offset++) {
      expect(index.locate(offset), `offset ${offset}`).toEqual(naive(text, offset))
    }
  })

  it('clamps out-of-range offsets to the first and last line', () => {
    const index = createLineIndex('a\nb\nc')
    expect(index.lineAt(-5)).toBe(0)
    expect(index.lineAt(9999)).toBe(2)
  })

  it('stays correct past the initial table capacity', () => {
    const n = 5000 // well past the 64-entry seed, so the array grew several times
    const text = Array.from({ length: n }, (_, i) => `line ${i}`).join('\n')
    const index = createLineIndex(text)
    expect(index.count).toBe(n)
    expect(index.lineAt(text.length)).toBe(n - 1)
    expect(index.locate(text.indexOf('line 4321'))).toEqual({ line: 4321, col: 0 })
  })

  it('memoizes toArray so repeated renders do not re-split', () => {
    const index = createLineIndex('a\nb')
    __resetLineIndexStats()
    expect(index.toArray()).toBe(index.toArray())
    expect(index.toArray()).toEqual(['a', 'b'])
    expect(__lineIndexStats()).toMatchObject({ arrayReads: 3, arraySplits: 1 })
  })
})

describe('createLineIndexCache', () => {
  it('holds two texts, so alternating between them never rebuilds', () => {
    const linesOf = createLineIndexCache()
    // Fresh identities, not literals — the cache keys on `===`.
    const live = ['a', 'b'].join('\n')
    const lagged = ['a', 'c'].join('\n')
    linesOf(live)
    linesOf(lagged)

    __resetLineIndexStats()
    for (let i = 0; i < 10; i++) {
      linesOf(live)
      linesOf(lagged)
    }
    expect(__lineIndexStats().builds).toBe(0)
  })

  it('builds once for a text it has not seen', () => {
    const linesOf = createLineIndexCache()
    __resetLineIndexStats()
    const text = ['x', 'y'].join('\n')
    expect(linesOf(text)).toBe(linesOf(text))
    expect(__lineIndexStats().builds).toBe(1)
  })

  it('evicts the least recently used of the two slots', () => {
    const linesOf = createLineIndexCache()
    const a = ['a'].join('')
    const b = ['b'].join('')
    const c = ['c'].join('')
    linesOf(a)
    linesOf(b)
    linesOf(c) // evicts `a`
    __resetLineIndexStats()
    linesOf(b)
    linesOf(c)
    expect(__lineIndexStats().builds).toBe(0)
    linesOf(a)
    expect(__lineIndexStats().builds).toBe(1)
  })
})
