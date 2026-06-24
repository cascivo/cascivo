import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeMarkdownDoc } from '../../engine/large-doc.fixture.ts'
import { __resetTokenizeCount, __tokenizeCount, clearTokenizeCache } from '../../engine/tokenize.ts'
import { CodeEditor, OVERSCAN } from './code-editor.tsx'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

/** Stub a line height so windowing math runs deterministically. */
function stubLineHeight(px: number): void {
  const real = window.getComputedStyle.bind(window)
  vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element) => {
    if (el.tagName === 'TEXTAREA') return { lineHeight: `${px}px` } as CSSStyleDeclaration
    return real(el)
  })
}

describe('CodeEditor performance', () => {
  it('windows a large document to a small visible slice', () => {
    stubLineHeight(20)
    const doc = Array.from({ length: 5000 }, (_, i) => `line ${i}`).join('\n')
    const { container } = render(
      <CodeEditor language="plaintext" defaultValue={doc} lineNumbers={false} />,
    )
    const ta = container.querySelector('textarea') as HTMLTextAreaElement
    Object.defineProperty(ta, 'clientHeight', { configurable: true, value: 400 })
    Object.defineProperty(ta, 'scrollTop', { configurable: true, writable: true, value: 0 })

    act(() => {
      fireEvent.scroll(ta)
    })
    const rows = container.querySelectorAll('pre code > span')
    // Auto-virtualized (>1000 lines): only a windowed slice is in the DOM…
    expect(rows.length).toBeLessThan(200)
    // …while the textarea still holds the entire document.
    expect(ta.value.split('\n').length).toBe(5000)
  })

  it('bounds a mid-document keystroke to the changed suffix, not the doc length', () => {
    const LINE_PX = 20
    const VIEWPORT_PX = 400
    stubLineHeight(LINE_PX)

    // Deterministic rAF so the highlight repaint is flushed on demand.
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const flush = (): void =>
      act(() => {
        for (const f of frames.splice(0)) f(0)
      })

    const doc = makeMarkdownDoc(50_000)
    const { container } = render(
      <CodeEditor language="markdown" defaultValue={doc} lineNumbers={false} />,
    )
    const ta = container.querySelector('textarea') as HTMLTextAreaElement
    Object.defineProperty(ta, 'clientHeight', { configurable: true, value: VIEWPORT_PX })
    Object.defineProperty(ta, 'scrollTop', { configurable: true, writable: true, value: 0 })
    flush()

    // Scroll to the middle so the window (and its prefix states) settle there.
    act(() => {
      ;(ta as unknown as { scrollTop: number }).scrollTop = 500_000 // ~line 25,000
      fireEvent.scroll(ta)
    })

    // Type one character into a middle line (the visible window).
    const lines = doc.split('\n')
    lines[25_000] = `${lines[25_000]}x`
    const next = lines.join('\n')
    act(() => {
      fireEvent.change(ta, { target: { value: next } })
    })

    // Measure only the highlight-repaint render for the keystroke.
    clearTokenizeCache()
    __resetTokenizeCount()
    flush()

    const visibleRows = Math.ceil(VIEWPORT_PX / LINE_PX)
    const k = 8
    const budget = visibleRows + OVERSCAN * 2 + k
    // Bounded by the window; a re-tokenize-from-line-0 path would be ~25,000.
    expect(__tokenizeCount()).toBeLessThanOrEqual(budget)
  })

  it('renders every row (no windowing) when wrapping is on', () => {
    stubLineHeight(20)
    const doc = Array.from({ length: 1200 }, (_, i) => `line ${i}`).join('\n')
    const { container } = render(
      <CodeEditor language="plaintext" defaultValue={doc} lineNumbers={false} wrap />,
    )
    // Wrap makes rows variable-height, so windowing is disabled and all rows render.
    const rows = container.querySelectorAll('pre code > span')
    expect(rows.length).toBe(1200)
  })
})
