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
  // tokenize() counter must stay window-bounded across a STEADY-STATE render — the
  // proxy for "is per-render work O(viewport)?". NOT a wall-clock assertion (flaky
  // in CI).
  //
  // Fails on the pre-T3 O(document) path (the counter is ~50,000 — the whole
  // document is tokenized every render). Passes once the view path tokenizes only
  // the visible window via tokenizeRange + the persistent line-state index: a
  // re-render at a settled scroll position re-tokenizes just the window (the prefix
  // states are already memoized in the index, so they are not recomputed).
  //
  // Large-doc test: 8k lines (not 50k) keeps the doc well above the old
  // MAX_CACHE = 5000 memo cliff so the O(document) regression is still exercised,
  // while the initial jsdom mount (the whole doc mounts before the measure effect
  // enables windowing) stays fast and reliable on constrained CI runners — a 50k
  // mount could exceed the timeout (matches perf.test.tsx). The timeout stays
  // generous as a margin for slow CI.
  it('tokenizes only the visible window per render on an 8k-line doc', () => {
    const LINE_PX = 20
    const VIEWPORT_PX = 400
    stubLineHeight(LINE_PX)

    const doc = makeMarkdownDoc(8_000)
    const { container } = render(
      createElement(CodeEditor, { language: 'markdown', defaultValue: doc, lineNumbers: false }),
    )
    const ta = container.querySelector('textarea') as HTMLTextAreaElement
    Object.defineProperty(ta, 'clientHeight', { configurable: true, value: VIEWPORT_PX })
    Object.defineProperty(ta, 'scrollTop', { configurable: true, writable: true, value: 0 })

    // Prime: scroll deep into the document so the index memoizes the prefix states
    // up to the window (a one-time lazy cost, not the per-render steady state).
    act(() => {
      ;(ta as unknown as { scrollTop: number }).scrollTop = 20_000
      fireEvent.scroll(ta)
    })

    // Now measure a steady-state render: nudge the scroll a couple of rows so the
    // view re-renders at an already-indexed region.
    clearTokenizeCache()
    __resetTokenizeCount()
    act(() => {
      ;(ta as unknown as { scrollTop: number }).scrollTop = 20_040
      fireEvent.scroll(ta)
    })

    const visibleRows = Math.ceil(VIEWPORT_PX / LINE_PX)
    const k = 8 // boundary-threading slack
    const budget = visibleRows + OVERSCAN * 2 + k
    expect(__tokenizeCount()).toBeLessThanOrEqual(budget)
  }, 30_000)
})
