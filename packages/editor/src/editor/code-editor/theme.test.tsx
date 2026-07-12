import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CodeEditor } from './code-editor.tsx'

function root(): HTMLElement {
  return screen.getByRole('combobox').closest('[style]') as HTMLElement
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CodeEditor theming', () => {
  it('applies per-instance theme overrides to the root', () => {
    render(<CodeEditor defaultValue="x" theme={{ '--cascivo-editor-bg': 'rgb(1, 2, 3)' }} />)
    expect(root().style.getPropertyValue('--cascivo-editor-bg')).toBe('rgb(1, 2, 3)')
  })

  it('re-themes live when the theme object changes (no remount)', () => {
    const { rerender } = render(
      <CodeEditor defaultValue="x" theme={{ '--cascivo-editor-bg': 'rgb(1, 2, 3)' }} />,
    )
    const before = root()
    rerender(<CodeEditor defaultValue="x" theme={{ '--cascivo-editor-bg': 'rgb(9, 9, 9)' }} />)
    const after = root()
    expect(after).toBe(before) // same node — Zen-mode swap, not a remount
    expect(after.style.getPropertyValue('--cascivo-editor-bg')).toBe('rgb(9, 9, 9)')
  })
})

describe('CodeEditor bracket matching', () => {
  it('decorates the matching pair adjacent to the caret', () => {
    render(<CodeEditor defaultValue="(ab)" lineNumbers={false} bracketMatching />)
    const ta = screen.getByRole('combobox') as HTMLTextAreaElement
    ta.setSelectionRange(0, 0) // caret before '('
    fireEvent.keyUp(ta)
    const marks = document.querySelectorAll('pre code [class*="bracketMatch"]')
    expect(marks.length).toBe(2)
  })

  it('renders no bracket decorations when disabled', () => {
    render(<CodeEditor defaultValue="(ab)" lineNumbers={false} />)
    const ta = screen.getByRole('combobox') as HTMLTextAreaElement
    ta.setSelectionRange(0, 0)
    fireEvent.keyUp(ta)
    expect(document.querySelectorAll('pre code [class*="bracketMatch"]').length).toBe(0)
  })
})
