import { act, fireEvent, render } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CodeEditor, OVERSCAN } from '../editor/code-editor/code-editor.tsx'
import { makeMarkdownDoc } from './large-doc.fixture.ts'
import { __resetTokenizeCount, __tokenizeCount, clearTokenizeCache } from './tokenize.ts'

afterEach(() => {
  vi.restoreAllMocks()
})

/** Stub a fixed line-box height so the windowing math runs deterministically in jsdom. */
function stubLineHeight(px: number): void {
  const real = window.getComputedStyle.bind(window)
  vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element) => {
    if (el.tagName === 'TEXTAREA') return { lineHeight: `${px}px` } as CSSStyleDeclaration
    return real(el)
  })
}

describe('tokenizer per-render budget', () => {
  // Deterministic perf guard (master-plan Decision 8): the instrumented per-line
  // tokenize() counter must stay window-bounded across a render — the proxy for
  // "is per-render work O(viewport)?". NOT a wall-clock assertion (flaky in CI).
  //
  // FAILS today: the view path calls tokenizeDocument over the WHOLE document, so
  // the counter is ~50,000. Goes GREEN after T3 swaps the view path to
  // tokenizeRange over the visible window. Skipped until then so the suite stays
  // green; see the UNSKIP marker.
  // UNSKIP IN T3: change `it.skip` → `it` once the view path uses tokenizeRange.
  it.skip('tokenizes only the visible window per render on a 50k-line doc', () => {
    const LINE_PX = 20
    const VIEWPORT_PX = 400
    stubLineHeight(LINE_PX)

    const doc = makeMarkdownDoc(50_000)
    const { container } = render(
      createElement(CodeEditor, { language: 'markdown', defaultValue: doc, lineNumbers: false }),
    )
    const ta = container.querySelector('textarea') as HTMLTextAreaElement
    Object.defineProperty(ta, 'clientHeight', { configurable: true, value: VIEWPORT_PX })
    Object.defineProperty(ta, 'scrollTop', { configurable: true, writable: true, value: 0 })

    // Prime: let the first paint populate the cache, then measure a fresh render.
    act(() => {
      fireEvent.scroll(ta)
    })
    clearTokenizeCache()
    __resetTokenizeCount()

    act(() => {
      ;(ta as unknown as { scrollTop: number }).scrollTop = 4000
      fireEvent.scroll(ta)
    })

    const visibleRows = Math.ceil(VIEWPORT_PX / LINE_PX)
    const k = 8 // boundary-threading slack
    const budget = visibleRows + OVERSCAN * 2 + k
    expect(__tokenizeCount()).toBeLessThanOrEqual(budget)
  })
})
