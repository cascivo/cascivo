import { describe, expect, it, vi } from 'vitest'
import { createCLikeGrammar, JS_KEYWORDS } from '../grammars/clike.ts'
import { clearTokenizeCache, tokenizeDocument } from './tokenize.ts'
import type { Grammar } from './types.ts'

/** A grammar that counts how many times a line is actually tokenized. */
function spyGrammar(name: string): { grammar: Grammar; calls: () => number } {
  const inner = createCLikeGrammar(name, JS_KEYWORDS)
  const spy = vi.fn(inner.tokenizeLine.bind(inner))
  return {
    grammar: { name: inner.name, initialState: inner.initialState, tokenizeLine: spy },
    calls: () => spy.mock.calls.length,
  }
}

describe('per-line memoization', () => {
  it('re-tokenizes only the changed line on a single-line edit', () => {
    clearTokenizeCache()
    const { grammar, calls } = spyGrammar('memo-test-1')
    const doc = ['const a = 1', 'const b = 2', 'const c = 3', 'const d = 4'].join('\n')

    tokenizeDocument(grammar, doc) // cold: 4 lines
    expect(calls()).toBe(4)

    // Change only the third line; the others are unchanged (same start-state + text).
    const edited = ['const a = 1', 'const b = 2', 'const c = 99', 'const d = 4'].join('\n')
    tokenizeDocument(grammar, edited)
    // Exactly one additional tokenizeLine call — the changed line.
    expect(calls()).toBe(5)
  })

  it('invalidates following lines until a multi-line construct closes', () => {
    clearTokenizeCache()
    const { grammar, calls } = spyGrammar('memo-test-2')
    const doc = ['let x = 1', 'let y = 2', 'let z = 3'].join('\n')
    tokenizeDocument(grammar, doc)
    expect(calls()).toBe(3)

    // Open an unterminated block comment on line 1: line 1 changes AND lines 2–3
    // now start in the `block` state, so all three must re-tokenize.
    const edited = ['let x = 1 /* open', 'let y = 2', 'let z = 3'].join('\n')
    tokenizeDocument(grammar, edited)
    expect(calls()).toBe(6)
  })

  it('produces identical tokens to a non-memoized run', () => {
    clearTokenizeCache()
    const { grammar } = spyGrammar('memo-test-3')
    const doc = 'const s = `multi\nline` /* c\nomment */ const n = 42'
    const first = tokenizeDocument(grammar, doc)
    const second = tokenizeDocument(grammar, doc) // all hits
    expect(second).toEqual(first)
  })

  it('a single-line edit in a large document does work proportional to one line', () => {
    clearTokenizeCache()
    const { grammar, calls } = spyGrammar('memo-bench')
    const N = 1000
    const base = Array.from({ length: N }, (_, i) => `const v${i} = ${i}`)
    tokenizeDocument(grammar, base.join('\n'))
    const cold = calls()
    expect(cold).toBe(N)

    const edited = [...base]
    edited[500] = 'const v500 = 500999'
    tokenizeDocument(grammar, edited.join('\n'))
    const warmDelta = calls() - cold
    // The memoized edit re-tokenizes a single line, not the whole document.
    expect(warmDelta).toBe(1)
    expect(warmDelta).toBeLessThan(N / 100)
  })
})
