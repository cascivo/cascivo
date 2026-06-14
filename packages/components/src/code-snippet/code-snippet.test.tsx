import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CodeSnippet } from './code-snippet'

afterEach(cleanup)

describe('CodeSnippet', () => {
  it('renders inline code without a copy button by default', () => {
    render(<CodeSnippet variant="inline" code="npm i" />)
    expect(screen.getByText('npm i').tagName).toBe('CODE')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders single-line code in a pre with a copy button', () => {
    const { container } = render(<CodeSnippet variant="single" code="echo hi" />)
    expect(container.querySelector('pre')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument()
  })

  it('renders multi-line code with line numbers', () => {
    render(<CodeSnippet variant="multi" code={'a\nb\nc'} showLineNumbers />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  describe('copy', () => {
    beforeEach(() => {
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      })
    })

    it('copies the code and flips the label to copied', async () => {
      render(<CodeSnippet variant="single" code="echo hi" />)
      await userEvent.click(screen.getByRole('button', { name: /copy/i }))
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('echo hi')
      expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument()
    })
  })
})
