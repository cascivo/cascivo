import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TimePicker } from './time-picker'

describe('TimePicker', () => {
  it('renders a time input with a label', () => {
    render(<TimePicker label="Meeting time" />)
    expect(screen.getByLabelText('Meeting time')).toBeInTheDocument()
    expect(screen.getByLabelText('Meeting time')).toHaveAttribute('type', 'time')
  })

  it('applies size data attribute', () => {
    render(<TimePicker label="Time" size="lg" />)
    expect(document.querySelector('[data-size="lg"]')).toBeInTheDocument()
  })

  it('fires onChange with the string value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TimePicker label="Time" onChange={onChange} />)
    const input = screen.getByLabelText('Time')
    await user.type(input, '14:30')
    expect(onChange).toHaveBeenCalled()
    expect(onChange.mock.calls.at(-1)?.[0]).toBeTruthy()
  })

  it('renders error message with role="alert"', () => {
    render(<TimePicker label="Time" error="Time is required" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Time is required')
    expect(document.querySelector('[data-state="error"]')).toBeInTheDocument()
  })

  it('renders hint when no error', () => {
    render(<TimePicker label="Time" hint="24h format" />)
    expect(screen.getByText('24h format')).toBeInTheDocument()
  })

  it('is disabled when disabled prop is set', () => {
    render(<TimePicker label="Time" disabled />)
    expect(screen.getByLabelText('Time')).toBeDisabled()
  })

  it('min, max, step are forwarded to the input', () => {
    render(<TimePicker label="Time" min="08:00" max="18:00" step={900} />)
    const input = screen.getByLabelText('Time')
    expect(input).toHaveAttribute('min', '08:00')
    expect(input).toHaveAttribute('max', '18:00')
    expect(input).toHaveAttribute('step', '900')
  })
})
