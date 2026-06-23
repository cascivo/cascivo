import { describe, expect, it } from 'vitest'
import { replaceAll, scan, toDecorations } from './find.ts'

describe('scan', () => {
  it('finds all case-insensitive matches by default', () => {
    expect(scan('a A a', 'a')).toEqual([
      { start: 0, end: 1 },
      { start: 2, end: 3 },
      { start: 4, end: 5 },
    ])
  })

  it('respects caseSensitive', () => {
    expect(scan('a A a', 'A', { caseSensitive: true })).toEqual([{ start: 2, end: 3 }])
  })

  it('respects wholeWord', () => {
    expect(scan('cat category cat', 'cat', { wholeWord: true })).toEqual([
      { start: 0, end: 3 },
      { start: 13, end: 16 },
    ])
  })

  it('returns nothing for an empty query', () => {
    expect(scan('abc', '')).toEqual([])
  })
})

describe('toDecorations', () => {
  it('maps matches to per-line column decorations and marks the current', () => {
    const text = 'foo\nbar foo'
    const matches = scan(text, 'foo')
    const decos = toDecorations(text, matches, 1, { match: 'm', current: 'c' })
    expect(decos).toEqual([
      { line: 0, start: 0, end: 3, className: 'm' },
      { line: 1, start: 4, end: 7, className: 'c' },
    ])
  })
})

describe('replaceAll', () => {
  it('replaces every match left-to-right via right-to-left application', () => {
    const text = 'a x a x a'
    const matches = scan(text, 'a')
    expect(replaceAll(text, matches, 'Z')).toBe('Z x Z x Z')
  })

  it('handles a replacement longer than the match', () => {
    const text = 'cat cat'
    const matches = scan(text, 'cat')
    expect(replaceAll(text, matches, 'tiger')).toBe('tiger tiger')
  })
})
