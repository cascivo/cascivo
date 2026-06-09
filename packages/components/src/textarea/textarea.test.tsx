import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Textarea } from './textarea'

describe('Textarea', () => {
  it('renders with label', () => {
    render(<Textarea label="Message" />)
    expect(screen.getByLabelText('Message')).toBeInTheDocument()
  })

  it('is multiline', () => {
    render(<Textarea label="Message" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-multiline', 'true')
  })

  it('shows error message and marks invalid', () => {
    render(<Textarea label="Bio" error="Required" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Required')
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('hides hint when error is shown', () => {
    render(<Textarea label="Bio" hint="Tell us about you" error="Required" />)
    expect(screen.queryByText('Tell us about you')).not.toBeInTheDocument()
  })

  it('calls onChange when typing', async () => {
    const handler = vi.fn()
    render(<Textarea onChange={handler} />)
    await userEvent.type(screen.getByRole('textbox'), 'hi')
    expect(handler).toHaveBeenCalled()
  })
})
