import { fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { CodeEditor } from './code-editor.tsx'

function getTextarea(): HTMLTextAreaElement {
  return screen.getByRole('textbox') as HTMLTextAreaElement
}

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
