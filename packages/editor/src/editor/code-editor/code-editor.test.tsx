import { act, fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CodeEditor, type CodeEditorHandle } from './code-editor.tsx'
import hl from '../highlight/highlight.module.css'

function getTextarea(): HTMLTextAreaElement {
  return screen.getByRole('textbox') as HTMLTextAreaElement
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('CodeEditor', () => {
  it('renders a textarea with the value', () => {
    render(<CodeEditor language="javascript" defaultValue="const x = 1" />)
    expect(getTextarea().value).toBe('const x = 1')
  })

  it('updates an uncontrolled editor and fires onValueChange', () => {
    const onValueChange = vi.fn()
    render(<CodeEditor onValueChange={onValueChange} />)
    const ta = getTextarea()
    fireEvent.change(ta, { target: { value: 'hello' } })
    expect(ta.value).toBe('hello')
    expect(onValueChange).toHaveBeenCalledWith('hello')
  })

  it('respects a controlled value', () => {
    const { rerender } = render(<CodeEditor value="a" onValueChange={() => {}} />)
    expect(getTextarea().value).toBe('a')
    rerender(<CodeEditor value="b" onValueChange={() => {}} />)
    expect(getTextarea().value).toBe('b')
  })

  it('inserts spaces on Tab and prevents default', () => {
    render(<CodeEditor defaultValue="" tabSize={2} />)
    const ta = getTextarea()
    ta.setSelectionRange(0, 0)
    const event = fireEvent.keyDown(ta, { key: 'Tab' })
    // fireEvent returns false when preventDefault was called.
    expect(event).toBe(false)
    expect(ta.value).toBe('  ')
  })

  it('dedents a selected block on Shift+Tab', () => {
    render(<CodeEditor defaultValue={'    a\n    b'} tabSize={2} />)
    const ta = getTextarea()
    ta.setSelectionRange(0, ta.value.length)
    fireEvent.keyDown(ta, { key: 'Tab', shiftKey: true })
    expect(ta.value).toBe('  a\n  b')
  })

  it('blocks edits when readOnly', () => {
    render(<CodeEditor defaultValue="x" readOnly />)
    const ta = getTextarea()
    expect(ta.readOnly).toBe(true)
    ta.setSelectionRange(1, 1)
    const event = fireEvent.keyDown(ta, { key: 'Tab' })
    // readOnly path does not preventDefault (Tab moves focus natively).
    expect(event).toBe(true)
    expect(ta.value).toBe('x')
  })

  it('debounces the highlight layer to a frame while the textarea stays current', () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      frames.push(cb)
      return frames.length
    })
    vi.stubGlobal('cancelAnimationFrame', () => {})

    const { container } = render(<CodeEditor language="javascript" defaultValue="a" />)
    const ta = getTextarea()
    const pre = container.querySelector('pre') as HTMLPreElement

    fireEvent.change(ta, { target: { value: 'ab' } })
    expect(ta.value).toBe('ab') // textarea is always current
    expect(pre.textContent).toBe('a') // highlight not yet repainted

    act(() => {
      for (const frame of frames) frame(0)
    })
    expect(pre.textContent).toBe('ab') // converges after the frame

    vi.unstubAllGlobals()
  })

  it('windows the highlight layer to the visible range for large documents', () => {
    const realGetComputedStyle = window.getComputedStyle.bind(window)
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element) => {
      if (el.tagName === 'TEXTAREA') return { lineHeight: '20px' } as CSSStyleDeclaration
      return realGetComputedStyle(el)
    })

    const doc = Array.from({ length: 500 }, (_, i) => `line ${i}`).join('\n')
    const { container } = render(
      <CodeEditor language="plaintext" defaultValue={doc} virtualize lineNumbers={false} />,
    )
    const ta = getTextarea()
    Object.defineProperty(ta, 'clientHeight', { configurable: true, value: 200 })
    Object.defineProperty(ta, 'scrollTop', { configurable: true, writable: true, value: 0 })

    act(() => {
      fireEvent.scroll(ta)
    })
    const rowsAtTop = container.querySelectorAll('pre code > span')
    expect(rowsAtTop.length).toBeGreaterThan(0)
    expect(rowsAtTop.length).toBeLessThan(500) // only the visible window renders
    expect(rowsAtTop[0]!.textContent).toBe('line 0')

    act(() => {
      ;(ta as unknown as { scrollTop: number }).scrollTop = 2000
      fireEvent.scroll(ta)
    })
    const rowsScrolled = container.querySelectorAll('pre code > span')
    expect(rowsScrolled[0]!.textContent).toBe('line 88') // window followed the scroll

    vi.restoreAllMocks()
  })

  it('highlights a window that opens inside a fenced block (cross-line state)', () => {
    const realGetComputedStyle = window.getComputedStyle.bind(window)
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element) => {
      if (el.tagName === 'TEXTAREA') return { lineHeight: '20px' } as CSSStyleDeclaration
      return realGetComputedStyle(el)
    })

    // A TypeScript fence opens near the top and never closes, so every body line
    // is inside the fence. If the windowed tokenizer started a mid-document window
    // in the wrong state, `const` would render as plain text, not a keyword.
    const body = Array.from({ length: 2000 }, (_, i) => `const v${i} = ${i}`)
    const doc = ['# Heading', '```ts', ...body].join('\n')
    const { container } = render(
      <CodeEditor language="markdown" defaultValue={doc} virtualize lineNumbers={false} />,
    )
    const ta = getTextarea()
    Object.defineProperty(ta, 'clientHeight', { configurable: true, value: 200 })
    Object.defineProperty(ta, 'scrollTop', { configurable: true, writable: true, value: 0 })

    act(() => {
      ;(ta as unknown as { scrollTop: number }).scrollTop = 8000 // ~line 400, mid-fence
      fireEvent.scroll(ta)
    })

    const rows = container.querySelectorAll('pre code > span')
    expect(rows.length).toBeLessThan(2002) // windowed
    // Inside the fence, each body line is a single `string`-kind span. If the
    // window had started in the wrong (default) state, it would be `plain` instead.
    const fenced = [...container.querySelectorAll('pre code span')].find(
      (s) => s.className === hl['string'] && s.textContent?.startsWith('const v'),
    )
    expect(fenced, 'a fenced body line renders as a string span in the window').toBeDefined()

    vi.restoreAllMocks()
  })

  it('recolors lines below when an edit opens a fenced block (state reconvergence)', () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const flush = (): void =>
      act(() => {
        for (const f of frames.splice(0)) f(0)
      })

    const { container } = render(
      <CodeEditor language="markdown" defaultValue={'alpha\nbeta\ngamma'} lineNumbers={false} />,
    )
    flush()
    const ta = getTextarea()
    const stringBeta = (): Element | undefined =>
      [...container.querySelectorAll('pre code span')].find(
        (s) => s.className === hl['string'] && s.textContent === 'beta',
      )
    expect(stringBeta(), 'beta is plain before the fence opens').toBeUndefined()

    // Open a fence on line 0 → lines below enter the fence (string) state.
    act(() => {
      fireEvent.change(ta, { target: { value: '```ts\nbeta\ngamma' } })
    })
    flush()
    expect(stringBeta(), 'beta recolors once the fence opens above it').toBeDefined()

    vi.unstubAllGlobals()
  })

  it('restores downstream highlighting on undo', () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const flush = (): void =>
      act(() => {
        for (const f of frames.splice(0)) f(0)
      })

    const { container } = render(
      <CodeEditor language="markdown" defaultValue={'```ts\nbeta'} lineNumbers={false} />,
    )
    flush()
    const ta = getTextarea()
    const stringBeta = (): Element | undefined =>
      [...container.querySelectorAll('pre code span')].find(
        (s) => s.className === hl['string'] && s.textContent === 'beta',
      )
    expect(stringBeta(), 'beta starts inside the fence').toBeDefined()

    // Close the fence by replacing line 0 → beta becomes plain.
    act(() => {
      fireEvent.change(ta, { target: { value: 'plain\nbeta' } })
    })
    flush()
    expect(stringBeta(), 'beta is plain after the fence closes').toBeUndefined()

    // Undo restores both the text AND the downstream highlighting.
    act(() => {
      fireEvent.keyDown(ta, { key: 'z', ctrlKey: true })
    })
    flush()
    expect(ta.value).toBe('```ts\nbeta')
    expect(stringBeta(), 'undo re-threads the fence state below the edit').toBeDefined()

    vi.unstubAllGlobals()
  })

  it('re-seeds highlighting when the controlled value is swapped', () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const flush = (): void =>
      act(() => {
        for (const f of frames.splice(0)) f(0)
      })

    const { container, rerender } = render(
      <CodeEditor
        language="markdown"
        value={'one\ntwo'}
        onValueChange={() => {}}
        lineNumbers={false}
      />,
    )
    flush()
    const stringTwo = (): Element | undefined =>
      [...container.querySelectorAll('pre code span')].find(
        (s) => s.className === hl['string'] && s.textContent === 'two',
      )
    expect(stringTwo()).toBeUndefined()

    // Programmatic whole-document swap whose 2nd line is inside a fence.
    rerender(
      <CodeEditor
        language="markdown"
        value={'```ts\ntwo'}
        onValueChange={() => {}}
        lineNumbers={false}
      />,
    )
    flush()
    expect(stringTwo(), 'the swapped document re-seeds the state index').toBeDefined()

    vi.unstubAllGlobals()
  })

  it('undoes and redoes an edit with Mod-Z / Mod-Shift-Z', () => {
    render(<CodeEditor defaultValue="" />)
    const ta = getTextarea()
    fireEvent.change(ta, { target: { value: 'hello' } })
    expect(ta.value).toBe('hello')

    fireEvent.keyDown(ta, { key: 'z', ctrlKey: true })
    expect(ta.value).toBe('') // undo

    fireEvent.keyDown(ta, { key: 'z', ctrlKey: true, shiftKey: true })
    expect(ta.value).toBe('hello') // redo
  })

  it('does not resurrect pre-set text on undo after a programmatic value change', () => {
    const { rerender } = render(<CodeEditor value="a" onValueChange={() => {}} />)
    rerender(<CodeEditor value="b" onValueChange={() => {}} />)
    const ta = getTextarea()
    expect(ta.value).toBe('b')
    // Undo must not restore the externally-replaced 'a'.
    fireEvent.keyDown(ta, { key: 'z', ctrlKey: true })
    expect(ta.value).toBe('b')
  })

  it('preserves the caret when an external value insert lands before it', () => {
    const { rerender } = render(<CodeEditor value="hello world" onValueChange={() => {}} />)
    const ta = getTextarea()
    ta.setSelectionRange(5, 5) // caret after "hello"
    act(() => {
      fireEvent.keyUp(ta) // capture the selection into the editor
    })
    rerender(<CodeEditor value="Xhello world" onValueChange={() => {}} />)
    expect(ta.value).toBe('Xhello world')
    expect(ta.selectionStart).toBe(6) // shifted right by the inserted "X", not jumped to end
    expect(ta.selectionEnd).toBe(6)
  })

  it('does not echo onValueChange for an external value change', () => {
    const onValueChange = vi.fn()
    const { rerender } = render(<CodeEditor value="a" onValueChange={onValueChange} />)
    rerender(<CodeEditor value="ab" onValueChange={onValueChange} />)
    expect(onValueChange).not.toHaveBeenCalled() // external set must not loop back
  })

  it('exposes an imperative handle: applyEdit is undoable', () => {
    const ref = createRef<CodeEditorHandle>()
    render(<CodeEditor ref={ref} defaultValue="ac" />)
    const ta = getTextarea()
    act(() => {
      ref.current!.applyEdit({ from: 1, to: 1 }, 'b')
    })
    expect(ta.value).toBe('abc')
    act(() => {
      ref.current!.undo()
    })
    expect(ta.value).toBe('ac')
    // Undo restores the pre-edit snapshot, whose caret was the seeded start.
    expect(ref.current!.getSelection()).toEqual({ start: 0, end: 0 })
  })

  it('opens the find panel on Mod-F and highlights matches', () => {
    render(<CodeEditor defaultValue={'one two one'} lineNumbers={false} />)
    const ta = getTextarea()
    const event = fireEvent.keyDown(ta, { key: 'f', ctrlKey: true })
    expect(event).toBe(false) // preventDefault
    const search = screen.getByRole('search')
    const input = search.querySelector('input') as HTMLInputElement
    act(() => {
      fireEvent.change(input, { target: { value: 'one' } })
    })
    // Two matches highlighted in the overlay; one is the current.
    const current = document.querySelectorAll(
      'pre code .matchCurrent, pre code [class*="matchCurrent"]',
    )
    const all = document.querySelectorAll('pre code [class*="match"]')
    expect(all.length).toBeGreaterThanOrEqual(2)
    expect(current.length).toBe(1)
  })

  it('replace is undoable', () => {
    render(<CodeEditor defaultValue={'cat cat'} lineNumbers={false} />)
    const ta = getTextarea()
    fireEvent.keyDown(ta, { key: 'f', ctrlKey: true })
    const search = screen.getByRole('search')
    const input = search.querySelector('input') as HTMLInputElement
    act(() => {
      fireEvent.change(input, { target: { value: 'cat' } })
    })
    // Toggle replace, fill it, replace all.
    fireEvent.click(search.querySelector('button')!) // the toggle is the first button
    const replaceInput = search.querySelectorAll('input')[1] as HTMLInputElement
    act(() => {
      fireEvent.change(replaceInput, { target: { value: 'dog' } })
    })
    fireEvent.click(screen.getByText('Replace all'))
    expect(ta.value).toBe('dog dog')
    // Undo restores the original document.
    fireEvent.keyDown(ta, { key: 'z', ctrlKey: true })
    expect(ta.value).toBe('cat cat')
  })

  it('closes the find panel on Escape', () => {
    render(<CodeEditor defaultValue="x" lineNumbers={false} />)
    const ta = getTextarea()
    fireEvent.keyDown(ta, { key: 'f', ctrlKey: true })
    const input = screen.getByRole('search').querySelector('input') as HTMLInputElement
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('search')).toBeNull()
  })

  it('fires onSave on Mod-S and suppresses the browser dialog', () => {
    const onSave = vi.fn()
    render(<CodeEditor defaultValue="content" onSave={onSave} />)
    const ta = getTextarea()
    const event = fireEvent.keyDown(ta, { key: 's', ctrlKey: true })
    expect(event).toBe(false) // preventDefault
    expect(onSave).toHaveBeenCalledWith('content')
  })

  it('does not capture Mod-S when there is no onSave', () => {
    render(<CodeEditor defaultValue="x" />)
    const event = fireEvent.keyDown(getTextarea(), { key: 's', ctrlKey: true })
    expect(event).toBe(true) // not prevented — browser default runs
  })

  it('merges a custom keymap that overrides a built-in', () => {
    const onSave = vi.fn()
    const custom = vi.fn(() => true)
    render(<CodeEditor defaultValue="x" onSave={onSave} keymap={{ 'Mod-s': custom }} />)
    fireEvent.keyDown(getTextarea(), { key: 's', ctrlKey: true })
    expect(custom).toHaveBeenCalledOnce()
    expect(onSave).not.toHaveBeenCalled() // user binding wins
  })

  it('renders decorations from a provider prop', () => {
    render(
      <CodeEditor
        language="plaintext"
        defaultValue="hello"
        lineNumbers={false}
        decorations={[{ line: 0, start: 0, end: 2, className: 'udeco' }]}
      />,
    )
    expect(document.querySelector('pre code .udeco')).not.toBeNull()
  })

  it('uses no banned React hooks', () => {
    const files = [
      join(__dirname, 'code-editor.tsx'),
      join(__dirname, '..', 'highlight', 'highlight.tsx'),
      join(__dirname, '..', 'view.tsx'),
    ]
    for (const file of files) {
      const src = readFileSync(file, 'utf8')
      for (const banned of [
        'useState',
        'useEffect',
        'useContext',
        'useReducer',
        'useLayoutEffect',
      ]) {
        expect(src, `${file} should not import ${banned}`).not.toContain(banned)
      }
    }
  })
})
