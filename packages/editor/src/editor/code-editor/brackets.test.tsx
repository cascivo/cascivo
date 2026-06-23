import { describe, expect, it } from 'vitest'
import { matchBracket, toBracketDecorations } from './brackets.ts'

describe('matchBracket', () => {
  it('matches forward when the caret is before an opener', () => {
    expect(matchBracket('(ab)', 0)).toEqual({ open: 0, close: 3 })
  })
  it('matches backward when the caret is after a closer', () => {
    expect(matchBracket('(ab)', 4)).toEqual({ open: 0, close: 3 })
  })
  it('handles nesting', () => {
    // caret before the outer '['
    expect(matchBracket('[a(b)c]', 0)).toEqual({ open: 0, close: 6 })
    // caret before the inner '('
    expect(matchBracket('[a(b)c]', 2)).toEqual({ open: 2, close: 4 })
  })
  it('returns undefined when unbalanced or not on a bracket', () => {
    expect(matchBracket('(ab', 0)).toBeUndefined()
    expect(matchBracket('abc', 1)).toBeUndefined()
  })
})

describe('toBracketDecorations', () => {
  it('emits single-column decorations for the pair on their lines', () => {
    const text = '(\n)'
    const decos = toBracketDecorations(text, { open: 0, close: 2 }, 'bm')
    expect(decos).toEqual([
      { line: 0, start: 0, end: 1, className: 'bm' },
      { line: 1, start: 0, end: 1, className: 'bm' },
    ])
  })
})
