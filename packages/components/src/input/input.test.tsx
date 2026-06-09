import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from './input'

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('renders placeholder', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<Input label="Email" error="Required" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Required')
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows hint when no error', () => {
    render(<Input label="Email" hint="We never share your email" />)
    expect(screen.getByText('We never share your email')).toBeInTheDocument()
  })

  it('hides hint when error is shown', () => {
    render(<Input label="Email" hint="Hint text" error="Error text" />)
    expect(screen.queryByText('Hint text')).not.toBeInTheDocument()
  })

  it('is disabled when disabled prop is set', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('calls onChange when typing', async () => {
    const handler = vi.fn()
    render(<Input onChange={handler} />)
    await userEvent.type(screen.getByRole('textbox'), 'hello')
    expect(handler).toHaveBeenCalled()
  })
})
