import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Terminal } from './terminal'
import type { TerminalLine } from './terminal'

const LINES: TerminalLine[] = [
  { text: 'npx cascivo add button', prefix: '$', type: 'command' },
  { text: 'Added button.', type: 'output' },
]

describe('Terminal', () => {
  it('is a named group that is not a live region', () => {
    render(<Terminal lines={LINES} />)
    const group = screen.getByRole('group', { name: 'Terminal' })
    expect(group).not.toHaveAttribute('aria-live')
    expect(group.querySelector('[aria-live]')).toBeNull()
  })

  it('exposes the whole script as text from the first render', () => {
    render(<Terminal lines={LINES} />)
    expect(screen.getByText('$ npx cascivo add button', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('Added button.', { exact: false })).toBeInTheDocument()
  })

  it('types the visible lines and calls onComplete', async () => {
    const onComplete = vi.fn()
    const { container } = render(<Terminal lines={LINES} speed={50} onComplete={onComplete} />)
    await waitFor(() => expect(onComplete).toHaveBeenCalled(), { timeout: 2000 })
    const visible = container.querySelector('[aria-hidden="true"]')
    expect(visible).toHaveTextContent('Added button.')
  })

  // Regression: with `loop`, the original reset its indices and then stopped ticking, so the
  // animation froze on an empty first line instead of replaying.
  it('replays from the top when looping', async () => {
    const onComplete = vi.fn()
    render(<Terminal lines={[{ text: 'hi' }]} speed={50} loop onComplete={onComplete} />)
    await waitFor(() => expect(onComplete.mock.calls.length).toBeGreaterThanOrEqual(2), {
      timeout: 2000,
    })
  })

  it('accepts a custom name', () => {
    render(<Terminal lines={LINES} labels={{ label: 'Install demo' }} />)
    expect(screen.getByRole('group', { name: 'Install demo' })).toBeInTheDocument()
  })
})
