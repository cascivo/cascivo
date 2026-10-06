import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MessageActions } from './message-actions'

afterEach(() => {
  vi.useRealTimers()
})

describe('MessageActions', () => {
  it('is a named group that renders only the actions it was given', () => {
    const { rerender } = render(<MessageActions copyValue="Hi" />)
    const group = screen.getByRole('group', { name: 'Message actions' })
    expect(group).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Good response' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Regenerate' })).toBeNull()

    rerender(<MessageActions onFeedbackChange={() => {}} onRegenerate={() => {}} />)
    expect(screen.getByRole('button', { name: 'Good response' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bad response' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Regenerate' })).toBeInTheDocument()
  })

  it('toggles a rating with aria-pressed and reports it', async () => {
    const onFeedbackChange = vi.fn()
    render(<MessageActions onFeedbackChange={onFeedbackChange} />)
    const good = screen.getByRole('button', { name: 'Good response' })
    expect(good).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(good)
    expect(good).toHaveAttribute('aria-pressed', 'true')
    expect(onFeedbackChange).toHaveBeenLastCalledWith('good')

    await userEvent.click(screen.getByRole('button', { name: 'Bad response' }))
    expect(good).toHaveAttribute('aria-pressed', 'false')
    expect(onFeedbackChange).toHaveBeenLastCalledWith('bad')

    await userEvent.click(screen.getByRole('button', { name: 'Bad response' }))
    expect(onFeedbackChange).toHaveBeenLastCalledWith(null)
  })

  it('announces a rating through the shared live region', async () => {
    render(<MessageActions onFeedbackChange={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Good response' }))
    await vi.waitFor(() => {
      expect(
        Array.from(document.querySelectorAll('[aria-live]')).some(
          (el) => el.textContent === 'Thanks for your feedback',
        ),
      ).toBe(true)
    })
  })

  it('follows a controlled rating', () => {
    const { rerender } = render(<MessageActions feedback="bad" />)
    expect(screen.getByRole('button', { name: 'Bad response' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    rerender(<MessageActions feedback={null} />)
    expect(screen.getByRole('button', { name: 'Bad response' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('calls onRegenerate', async () => {
    const onRegenerate = vi.fn()
    render(<MessageActions onRegenerate={onRegenerate} />)
    await userEvent.click(screen.getByRole('button', { name: 'Regenerate' }))
    expect(onRegenerate).toHaveBeenCalledTimes(1)
  })
})
