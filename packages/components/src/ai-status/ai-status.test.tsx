import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AiStatus } from './ai-status'

describe('AiStatus', () => {
  it('announces the default label for each status', () => {
    const { rerender } = render(<AiStatus status="thinking" />)
    expect(screen.getByRole('status')).toHaveTextContent('Thinking…')
    rerender(<AiStatus status="generating" />)
    expect(screen.getByRole('status')).toHaveTextContent('Generating a response…')
    rerender(<AiStatus status="complete" />)
    expect(screen.getByRole('status')).toHaveTextContent('Done')
    rerender(<AiStatus status="error" />)
    expect(screen.getByRole('status')).toHaveTextContent('Something went wrong')
    rerender(<AiStatus status="stopped" />)
    expect(screen.getByRole('status')).toHaveTextContent('Stopped')
  })

  it('exposes the status as a data attribute', () => {
    const { container } = render(<AiStatus status="generating" />)
    expect(container.firstElementChild).toHaveAttribute('data-status', 'generating')
  })

  it('prefers label, then labels, over the catalog default', () => {
    const { rerender } = render(<AiStatus status="thinking" labels={{ thinking: 'Pondering…' }} />)
    expect(screen.getByRole('status')).toHaveTextContent('Pondering…')
    rerender(<AiStatus status="thinking" label="Searching 12 documents…" />)
    expect(screen.getByRole('status')).toHaveTextContent('Searching 12 documents…')
  })

  it('renders Stop only while in progress and only with onStop', async () => {
    const onStop = vi.fn()
    const { rerender } = render(<AiStatus status="thinking" />)
    expect(screen.queryByRole('button')).toBeNull()

    rerender(<AiStatus status="generating" onStop={onStop} />)
    await userEvent.click(screen.getByRole('button', { name: 'Stop' }))
    expect(onStop).toHaveBeenCalledTimes(1)

    rerender(<AiStatus status="complete" onStop={onStop} />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('keeps the Stop button outside the status region', () => {
    render(<AiStatus status="generating" onStop={() => {}} />)
    expect(screen.getByRole('status')).not.toContainElement(screen.getByRole('button'))
  })

  it('hides the glyph from assistive technology', () => {
    const { container } = render(<AiStatus status="thinking" />)
    expect(container.querySelector('svg')?.closest('[aria-hidden="true"]')).not.toBeNull()
  })
})
