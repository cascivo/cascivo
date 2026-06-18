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

  describe('syntax highlighting', () => {
    it('tokenizes css keywords, variables, and numbers into data-tok spans', () => {
      const { container } = render(
        <CodeSnippet variant="multi" language="css" code={'.a { --x: 8rem; }'} />,
      )
      expect(container.querySelector("[data-tok='variable']")?.textContent).toBe('--x')
      expect(container.querySelector("[data-tok='number']")?.textContent).toBe('8rem')
      // The full code is still present and copyable verbatim.
      expect(container.querySelector('code')?.textContent).toBe('.a { --x: 8rem; }')
    })

    it('highlights a ts string and keeps plain runs as bare spans', () => {
      const { container } = render(
        <CodeSnippet variant="multi" language="ts" code={"const name = 'Button'"} />,
      )
      expect(container.querySelector("[data-tok='keyword']")?.textContent).toBe('const')
      expect(container.querySelector("[data-tok='string']")?.textContent).toBe("'Button'")
    })

    it('does not highlight inline code', () => {
      const { container } = render(<CodeSnippet variant="inline" language="ts" code="const x" />)
      expect(container.querySelector('[data-tok]')).not.toBeInTheDocument()
    })
  })

  describe('terminal', () => {
    it('renders window chrome with a title and marks the prompt token', () => {
      const { container } = render(
        <CodeSnippet variant="multi" terminal language="bash" title="zsh" code={'$ npx cascivo'} />,
      )
      expect(container.querySelector("[data-terminal='']")).toBeInTheDocument()
      expect(screen.getByText('zsh')).toBeInTheDocument()
      expect(container.querySelector("[data-tok='prompt']")?.textContent).toBe('$')
      expect(container.querySelector("[data-tok='keyword']")?.textContent).toBe('npx')
    })
  })
})
