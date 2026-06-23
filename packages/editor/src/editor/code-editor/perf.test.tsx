import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CodeEditor } from './code-editor.tsx'

afterEach(() => {
  vi.restoreAllMocks()
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
