import { act, fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CodeEditor, type CodeEditorHandle } from './code-editor.tsx'

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
