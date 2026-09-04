import { describe, expect, it } from 'vitest'
import { diff, rebaseSelection } from './sync.ts'

describe('diff', () => {
  it('finds a minimal insertion span', () => {
    expect(diff('abc', 'aXbc')).toEqual({ from: 1, to: 1, insert: 'X' })
  })
  it('finds a minimal deletion span', () => {
    expect(diff('aXbc', 'abc')).toEqual({ from: 1, to: 2, insert: '' })
  })
  it('finds a minimal replacement span', () => {
    expect(diff('abcd', 'aZd')).toEqual({ from: 1, to: 3, insert: 'Z' })
  })
  it('reports no change as an empty span', () => {
    expect(diff('abc', 'abc')).toEqual({ from: 3, to: 3, insert: '' })
  })

  // The block scan must land on exactly the same span as a per-character scan for
  // edits at, across, and inside its 1k block boundaries — the oracle is the
  // per-char loop the block version replaced.
  it('agrees with a per-character scan around block boundaries', () => {
    const naive = (prev: string, next: string) => {
      const min = Math.min(prev.length, next.length)
      let start = 0
      while (start < min && prev[start] === next[start]) start++
      let endPrev = prev.length
      let endNext = next.length
      while (endPrev > start && endNext > start && prev[endPrev - 1] === next[endNext - 1]) {
        endPrev--
        endNext--
      }
      return { from: start, to: endPrev, insert: next.slice(start, endNext) }
    }
    const base = Array.from({ length: 400 }, (_, i) => `line ${i} of the fixture`).join('\n')
    // Offsets chosen to straddle 1024-multiples plus some arbitrary ones, with
    // deletions long enough to span a whole block.
    const offsets = [0, 1, 1023, 1024, 1025, 2047, 2048, 3000, 4096, 5000, base.length - 1]
    const lengths = [0, 1, 7, 1024, 1500]
    for (const at of offsets) {
      for (const len of lengths) {
        for (const insert of ['', 'Q', 'x'.repeat(1100)]) {
          const next = base.slice(0, at) + insert + base.slice(at + len)
          expect(diff(base, next), `edit at ${at} len ${len} insert ${insert.length}`).toEqual(
            naive(base, next),
          )
          expect(diff(next, base), `reverse at ${at} len ${len}`).toEqual(naive(next, base))
        }
      }
    }
  })

  it('handles a next text shorter than one block', () => {
    const long = 'a'.repeat(5000)
    expect(diff(long, 'a')).toEqual({ from: 1, to: 5000, insert: '' })
    expect(diff('a', long)).toEqual({ from: 1, to: 1, insert: 'a'.repeat(4999) })
    expect(diff(long, '')).toEqual({ from: 0, to: 5000, insert: '' })
  })
})

describe('rebaseSelection', () => {
  it('shifts a caret right when text is inserted before it', () => {
    const change = diff('abc', 'aXbc')
    expect(rebaseSelection(2, 2, change)).toEqual({ start: 3, end: 3 })
  })
  it('shifts a caret left when text is deleted before it', () => {
    const change = diff('aXbc', 'abc')
    expect(rebaseSelection(3, 3, change)).toEqual({ start: 2, end: 2 })
  })
  it('clamps a caret that sits inside the replaced span', () => {
    const change = diff('abcd', 'aZd')
    expect(rebaseSelection(2, 2, change)).toEqual({ start: 2, end: 2 })
  })
  it('leaves a caret untouched when the change is after it', () => {
    const change = diff('abcd', 'abcdX')
    expect(rebaseSelection(2, 2, change)).toEqual({ start: 2, end: 2 })
  })
})
