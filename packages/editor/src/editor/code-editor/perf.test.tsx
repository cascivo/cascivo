import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeMarkdownDoc } from '../../engine/large-doc.fixture.ts'
import { __lineIndexStats, __resetLineIndexStats } from '../../engine/line-index.ts'
import { __resetTokenizeCount, __tokenizeCount, clearTokenizeCache } from '../../engine/tokenize.ts'
import { CodeEditor, INITIAL_WINDOW_ROWS, OVERSCAN, WALK_BUDGET } from './code-editor.tsx'

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

  // Large-document perf test: proves a mid-document keystroke re-tokenizes only
  // the changed suffix (bounded by the window), not the whole doc. The doc stays
  // well above the old `MAX_CACHE = 5000` memo cliff so the regression is still
  // exercised, but at 8k lines (not 50k) the initial jsdom mount is fast and
  // reliable on constrained CI runners — a 50k mount could exceed the timeout.
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

    const DOC_LINES = 8000
    const MID_LINE = DOC_LINES / 2 // 4000
    const doc = makeMarkdownDoc(DOC_LINES)
    const { container } = render(
      <CodeEditor language="markdown" defaultValue={doc} lineNumbers={false} />,
    )
    const ta = container.querySelector('textarea') as HTMLTextAreaElement
    Object.defineProperty(ta, 'clientHeight', { configurable: true, value: VIEWPORT_PX })
    Object.defineProperty(ta, 'scrollTop', { configurable: true, writable: true, value: 0 })
    flush()

    // Scroll to the middle. This is a far jump (past WALK_BUDGET), so the prefix
    // threads over a few frames rather than synchronously — flush until it settles
    // so we measure the steady-state keystroke cost, not the one-time catch-up.
    act(() => {
      ;(ta as unknown as { scrollTop: number }).scrollTop = MID_LINE * LINE_PX
      fireEvent.scroll(ta)
    })
    for (let i = 0; i < 10; i++) flush()

    // Type one character into a middle line (the visible window).
    const lines = doc.split('\n')
    lines[MID_LINE] = `${lines[MID_LINE]}x`
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
    // Bounded by the window; a re-tokenize-from-line-0 path would be ~4,000.
    expect(__tokenizeCount()).toBeLessThanOrEqual(budget)
  }, 30_000)

  it('caps the first paint of a large document instead of rendering every row', () => {
    // No getComputedStyle stub: line height stays unmeasured (jsdom has no layout),
    // so this exercises the pre-measurement first-paint path — the mount that, before
    // the cap, committed every row (a 50k-line freeze) because windowing waited on a
    // measured line height that only arrives post-paint.
    const N = 10000
    const doc = Array.from({ length: N }, (_, i) => `line ${i}`).join('\n')
    const { container } = render(
      <CodeEditor language="plaintext" defaultValue={doc} lineNumbers={false} />,
    )
    const rows = container.querySelectorAll('pre code > span')
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.length).toBeLessThanOrEqual(INITIAL_WINDOW_ROWS)
    // The textarea still holds the entire document.
    const ta = container.querySelector('textarea') as HTMLTextAreaElement
    expect(ta.value.split('\n').length).toBe(N)
  })

  it('re-measures the viewport on resize so a grown editor fills new rows', () => {
    stubLineHeight(20)
    // jsdom has no ResizeObserver — install a controllable polyfill that lets the
    // test fire the resize callback on demand (like packages/flow's measure test).
    const observers: Array<() => void> = []
    class MockResizeObserver {
      constructor(cb: ResizeObserverCallback) {
        observers.push(() => cb([], this as unknown as ResizeObserver))
      }
      observe(): void {}
      disconnect(): void {}
    }
    vi.stubGlobal('ResizeObserver', MockResizeObserver)

    const doc = Array.from({ length: 5000 }, (_, i) => `line ${i}`).join('\n')
    const { container } = render(
      <CodeEditor language="plaintext" defaultValue={doc} lineNumbers={false} />,
    )
    const ta = container.querySelector('textarea') as HTMLTextAreaElement
    Object.defineProperty(ta, 'scrollTop', { configurable: true, writable: true, value: 0 })

    // Start with a short viewport: the window is small.
    Object.defineProperty(ta, 'clientHeight', { configurable: true, value: 200 })
    act(() => {
      fireEvent.scroll(ta)
    })
    const small = container.querySelectorAll('pre code > span').length

    // Grow the editor WITHOUT scrolling. Only the ResizeObserver can refresh the
    // viewport now; before this fix the window stayed sized to the old height and
    // the new bottom rows rendered blank/un-highlighted.
    Object.defineProperty(ta, 'clientHeight', { configurable: true, value: 1600 })
    act(() => {
      for (const fire of observers) fire()
    })
    const large = container.querySelectorAll('pre code > span').length

    expect(large).toBeGreaterThan(small)
  })

  it('does not synchronously thread the whole prefix on a far scrollbar jump', () => {
    const LINE_PX = 20
    const VIEWPORT_PX = 400
    stubLineHeight(LINE_PX)
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const flush = (): void =>
      act(() => {
        for (const f of frames.splice(0)) f(0)
      })

    const DOC_LINES = 8000
    // Markdown has cross-line state (fences), so the prefix genuinely needs threading
    // — the case that used to walk every intervening line synchronously on a jump.
    const doc = makeMarkdownDoc(DOC_LINES)
    const { container } = render(
      <CodeEditor language="markdown" defaultValue={doc} lineNumbers={false} />,
    )
    const ta = container.querySelector('textarea') as HTMLTextAreaElement
    Object.defineProperty(ta, 'clientHeight', { configurable: true, value: VIEWPORT_PX })
    Object.defineProperty(ta, 'scrollTop', { configurable: true, writable: true, value: 0 })
    flush()
    act(() => {
      fireEvent.scroll(ta)
    })
    for (let i = 0; i < 5; i++) flush() // settle the top window

    // Jump far to a region never visited (well past WALK_BUDGET from the threaded
    // prefix). The triggering render must stay window-bounded — NOT ~7,000 lines.
    clearTokenizeCache()
    __resetTokenizeCount()
    act(() => {
      ;(ta as unknown as { scrollTop: number }).scrollTop = 7000 * LINE_PX
      fireEvent.scroll(ta)
    })
    const onJump = __tokenizeCount()
    const visibleRows = Math.ceil(VIEWPORT_PX / LINE_PX)
    expect(onJump).toBeLessThanOrEqual(visibleRows + OVERSCAN * 2 + 8)

    // …but it does converge: flushing threads the skipped prefix over frames (real
    // tokenization, just spread out so no single frame freezes).
    for (let i = 0; i < 10; i++) flush()
    expect(__tokenizeCount()).toBeGreaterThan(WALK_BUDGET)
  }, 30_000)

  it('tracks the scroll position each frame when scroll events lag the compositor', () => {
    const LINE_PX = 20
    stubLineHeight(LINE_PX)
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const flush = (): void =>
      act(() => {
        for (const f of frames.splice(0)) f(0)
      })

    const doc = Array.from({ length: 5000 }, (_, i) => `line ${i}`).join('\n')
    const { container } = render(
      <CodeEditor language="plaintext" defaultValue={doc} lineNumbers={false} />,
    )
    const ta = container.querySelector('textarea') as HTMLTextAreaElement
    Object.defineProperty(ta, 'clientHeight', { configurable: true, value: 400 })
    Object.defineProperty(ta, 'scrollTop', { configurable: true, writable: true, value: 0 })
    flush()

    // One scroll event at the top starts the per-frame sampler.
    act(() => {
      fireEvent.scroll(ta)
    })
    expect((container.querySelector('pre code > span') as HTMLElement).textContent).toBe('line 0')

    // The compositor now moves WITHOUT firing a scroll event (momentum/fling, where
    // events are throttled below frame rate). A sampled frame must catch up to it.
    ;(ta as unknown as { scrollTop: number }).scrollTop = 4000
    flush()
    const expectedFirst = 4000 / LINE_PX - OVERSCAN // floor(4000/20) - OVERSCAN = 188
    expect((container.querySelector('pre code > span') as HTMLElement).textContent).toBe(
      `line ${expectedFirst}`,
    )
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

  it('under wrap, an edit re-tokenizes only the changed suffix while all rows render', () => {
    // Wrap disables DOM windowing (render is O(n)), but an edit must still
    // re-tokenize only the changed suffix until the state reconverges — not every
    // row. No content is hidden (no display:none): all rows stay in the DOM.
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const flush = (): void =>
      act(() => {
        for (const f of frames.splice(0)) f(0)
      })

    const N = 1500
    const doc = Array.from({ length: N }, (_, i) => `paragraph number ${i} with words`).join('\n')
    const { container } = render(
      <CodeEditor language="markdown" defaultValue={doc} lineNumbers={false} wrap />,
    )
    flush()
    expect(container.querySelectorAll('pre code > span').length).toBe(N) // all rows

    // Edit a middle line, then measure only the highlight-repaint render.
    const lines = doc.split('\n')
    lines[750] = `${lines[750]} edited`
    const next = lines.join('\n')
    const ta = container.querySelector('textarea') as HTMLTextAreaElement
    act(() => {
      fireEvent.change(ta, { target: { value: next } })
    })
    __resetTokenizeCount()
    flush()

    // Bounded by the changed suffix (here a single prose line reconverges at once),
    // NOT the document length — proof the index/memo apply under wrap too.
    expect(__tokenizeCount()).toBeLessThanOrEqual(8)
    // All rows still render after the edit (no hidden content).
    expect(container.querySelectorAll('pre code > span').length).toBe(N)
  })

  // ── Document line structure ────────────────────────────────────────────────
  // The current-line marker is the only cue for where an edit will land, and it is
  // recomputed on `input`, `keyup` AND `selectionchange` — three times per keystroke,
  // plus once per caret move. Each of those used to be
  // `value.slice(0, caret).split('\n').length`: O(n) with one string allocation per
  // line. At 50k lines that is ~2 ms and 50k allocations apiece, so under sustained
  // typing the marker fell behind the caret and the edit surface stopped feeling
  // attached to the text. These guards keep every line lookup off the document size.

  it('keeps the current-line marker exact deep inside a large document', () => {
    stubLineHeight(20)
    const N = 20000
    const doc = Array.from({ length: N }, (_, i) => `const value_${i} = ${i};`).join('\n')
    const { container } = render(<CodeEditor defaultValue={doc} lineNumbers={false} />)
    const root = container.firstChild as HTMLElement
    const ta = container.querySelector('textarea') as HTMLTextAreaElement

    // Line starts, computed independently of the component's own index.
    const starts = [0]
    for (let i = doc.indexOf('\n'); i !== -1; i = doc.indexOf('\n', i + 1)) starts.push(i + 1)

    for (const line of [0, 1, 9999, N - 2, N - 1]) {
      const offset = starts[line] as number
      ta.focus()
      ta.setSelectionRange(offset, offset)
      act(() => {
        document.dispatchEvent(new Event('selectionchange'))
      })
      expect(
        root.style.getPropertyValue('--cascivo-editor-caret-line'),
        `caret at line ${line}`,
      ).toBe(String(line))
    }
  })

  it('does not re-read the document structure when only the caret moves', () => {
    stubLineHeight(20)
    const doc = Array.from({ length: 20000 }, (_, i) => `const value_${i} = ${i};`).join('\n')
    const { container } = render(<CodeEditor defaultValue={doc} lineNumbers={false} />)
    const ta = container.querySelector('textarea') as HTMLTextAreaElement
    ta.focus()

    // Walk the caret across the document. The text never changes, so no lookup here
    // may cost more than a binary search.
    __resetLineIndexStats()
    for (let i = 0; i < 50; i++) {
      const offset = i * 137
      ta.setSelectionRange(offset, offset)
      act(() => {
        document.dispatchEvent(new Event('selectionchange'))
      })
    }
    const { builds, lookups } = __lineIndexStats()
    expect(builds).toBe(0)
    // Asserted together: a regression to `value.slice(0, caret).split('\n')` would
    // route around the index entirely and report zero rebuilds too.
    expect(lookups).toBeGreaterThanOrEqual(50)
  })

  it('reads the document structure at most once per keystroke', () => {
    stubLineHeight(20)
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const flush = (): void =>
      act(() => {
        for (const f of frames.splice(0)) f(0)
      })

    const doc = Array.from({ length: 20000 }, (_, i) => `const value_${i} = ${i};`).join('\n')
    const { container } = render(<CodeEditor defaultValue={doc} lineNumbers={false} />)
    const ta = container.querySelector('textarea') as HTMLTextAreaElement
    Object.defineProperty(ta, 'clientHeight', { configurable: true, value: 400 })
    Object.defineProperty(ta, 'scrollTop', { configurable: true, writable: true, value: 0 })
    flush()

    // Type five characters. The live textarea text and the rAF-lagged highlight text
    // are one frame apart, which is why the memo holds two slots: one build per
    // keystroke, not one per read.
    __resetLineIndexStats()
    let text = doc
    for (let i = 0; i < 5; i++) {
      text = `x${text}`
      act(() => {
        fireEvent.change(ta, { target: { value: text } })
      })
      flush()
    }
    const { builds, arraySplits } = __lineIndexStats()
    expect(builds).toBeLessThanOrEqual(5)
    expect(arraySplits).toBeLessThanOrEqual(5)
  })

  it('does not re-split or re-scan the document on a scroll frame', () => {
    stubLineHeight(20)
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const flush = (): void =>
      act(() => {
        for (const f of frames.splice(0)) f(0)
      })

    const doc = Array.from({ length: 20000 }, (_, i) => `const value_${i} = ${i};`).join('\n')
    const { container } = render(<CodeEditor defaultValue={doc} lineNumbers={false} />)
    const ta = container.querySelector('textarea') as HTMLTextAreaElement
    Object.defineProperty(ta, 'clientHeight', { configurable: true, value: 400 })
    Object.defineProperty(ta, 'scrollTop', { configurable: true, writable: true, value: 0 })
    flush()

    // The render reads `scrollTop`, so it re-runs on every scroll frame. Nothing
    // about the document changed, so nothing about it may be recomputed.
    __resetLineIndexStats()
    for (let i = 1; i <= 30; i++) {
      act(() => {
        ;(ta as unknown as { scrollTop: number }).scrollTop = i * 400
        fireEvent.scroll(ta)
      })
      flush()
    }
    const { builds, arrayReads, arraySplits } = __lineIndexStats()
    // The render asked for the lines on every frame (so it really does go through
    // the index — a direct `text.split('\n')` would read zero here)…
    expect(arrayReads).toBeGreaterThanOrEqual(30)
    // …and got the memoized array every time.
    expect(builds).toBe(0)
    expect(arraySplits).toBe(0)
  })
  it('decorates only the find matches inside the rendered window', () => {
    stubLineHeight(20)
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const flush = (): void =>
      act(() => {
        for (const f of frames.splice(0)) f(0)
      })

    // A hit on every one of 20k lines.
    const N = 20000
    const doc = Array.from({ length: N }, (_, i) => `const value_${i} = ${i};`).join('\n')
    const { container } = render(<CodeEditor defaultValue={doc} lineNumbers={false} />)
    const ta = container.querySelector('textarea') as HTMLTextAreaElement
    Object.defineProperty(ta, 'clientHeight', { configurable: true, value: 400 })
    Object.defineProperty(ta, 'scrollTop', { configurable: true, writable: true, value: 0 })
    flush()
    fireEvent.keyDown(ta, { key: 'f', ctrlKey: true })
    const input = screen.getByRole('search').querySelector('input') as HTMLInputElement
    act(() => {
      fireEvent.change(input, { target: { value: 'value' } })
    })
    act(() => {
      ;(ta as unknown as { scrollTop: number }).scrollTop = 10000 * 20
      fireEvent.scroll(ta)
    })
    for (let i = 0; i < 10; i++) flush()

    // One more scroll frame: the matches on screen are decorated…
    __resetLineIndexStats()
    act(() => {
      ;(ta as unknown as { scrollTop: number }).scrollTop = 10000 * 20 + 400
      fireEvent.scroll(ta)
    })
    flush()
    const decorated = container.querySelectorAll('pre code [class*="match"]').length
    expect(decorated).toBeGreaterThan(0)
    // …and only those were located — not all 20,000 (one `locate` per decorated
    // match; the bound is the window, which is ~20 visible rows + overscan).
    const { lookups } = __lineIndexStats()
    expect(lookups).toBeGreaterThan(0)
    expect(lookups).toBeLessThan(200)
  })
})
