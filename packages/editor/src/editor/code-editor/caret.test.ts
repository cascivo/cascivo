import { describe, expect, it } from 'vitest'
import { caretCoords, caretRectFromPre, type CaretMetrics } from './caret.ts'

const base: CaretMetrics = {
  charWidth: 8,
  lineHeight: 16,
  scrollTop: 0,
  scrollLeft: 0,
  padTop: 4,
  padLeft: 6,
  tabSize: 4,
}

describe('caretCoords', () => {
  it('places offset 0 at the content padding', () => {
    expect(caretCoords('', 0, base)).toEqual({ top: 4, left: 6 })
  })

  it('advances left by charWidth per column', () => {
    expect(caretCoords('abcd', 3, base)).toEqual({ top: 4, left: 3 * 8 + 6 })
  })

  it('advances top by lineHeight per line', () => {
    const { top, left } = caretCoords('a\nb\nc', 4, base) // line 2, col 0
    expect(top).toBe(2 * 16 + 4)
    expect(left).toBe(6)
  })

  it('expands a leading tab to the next tab stop', () => {
    // one \t then caret before the next char: visual col = tabSize (4) → 4*8
    const { left } = caretCoords('\tx', 1, base)
    expect(left).toBe(4 * 8 + 6)
  })

  it('aligns a tab to the stop when preceded by partial columns', () => {
    // 'ab' (2 cols) then '\t' → advances to col 4 (next multiple of 4)
    const { left } = caretCoords('ab\tx', 3, base)
    expect(left).toBe(4 * 8 + 6)
  })

  it('subtracts scroll offsets', () => {
    const m = { ...base, scrollTop: 10, scrollLeft: 5 }
    const { top, left } = caretCoords('a\nbc', 3, m) // line 1, col 1
    expect(top).toBe(1 * 16 - 10 + 4)
    expect(left).toBe(1 * 8 - 5 + 6)
  })
})

describe('caretRectFromPre', () => {
  // jsdom does not implement Range layout APIs (getClientRects), so this only
  // exercises the text-node accumulation + the not-rendered guard; the rect read
  // itself runs only in a real browser.
  it('returns null when the offset is beyond the rendered text', () => {
    const pre = document.createElement('pre')
    pre.append(document.createTextNode('hello'), document.createTextNode('world'))
    document.body.appendChild(pre)
    expect(caretRectFromPre(pre, 99)).toBeNull()
    pre.remove()
  })
})
