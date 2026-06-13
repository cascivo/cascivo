import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CopyButton } from './copy-button'

function stubClipboard() {
  const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  })
  return writeText
}

describe('CopyButton', () => {
  it('renders a button with the default i18n copy label', () => {
    render(<CopyButton value="npx cascivo add stat" />)
    const button = screen.getByRole('button', { name: 'Copy' })
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveAttribute('data-state', 'idle')
  })

  it('defaults to md size and applies the size data attribute', () => {
    const { rerender } = render(<CopyButton value="x" />)
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'md')
    rerender(<CopyButton value="x" size="sm" />)
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'sm')
  })

  it('writes the value to the clipboard and flips to the copied state', async () => {
    const writeText = stubClipboard()
    render(<CopyButton value="npx cascivo add stat" />)
    await userEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText).toHaveBeenCalledWith('npx cascivo add stat')
    const button = screen.getByRole('button', { name: 'Copied' })
    expect(button).toHaveAttribute('data-state', 'copied')
  })

  it('overrides both labels via the labels prop', async () => {
    stubClipboard()
    render(<CopyButton value="x" labels={{ copy: 'Kopieren', copied: 'Kopiert' }} />)
    await userEvent.click(screen.getByRole('button', { name: 'Kopieren' }))
    expect(screen.getByRole('button', { name: 'Kopiert' })).toBeInTheDocument()
  })

  it('merges className and forwards arbitrary props', () => {
    render(<CopyButton value="x" className="custom" data-testid="cb" />)
    expect(screen.getByTestId('cb')).toHaveClass('custom')
  })

  describe('revert timer', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('reverts to the copy label after 2 seconds', async () => {
      stubClipboard()
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<CopyButton value="x" />)
      await user.click(screen.getByRole('button', { name: 'Copy' }))
      expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
      act(() => {
        vi.advanceTimersByTime(2000)
      })
      const button = screen.getByRole('button', { name: 'Copy' })
      expect(button).toHaveAttribute('data-state', 'idle')
    })
  })
})
