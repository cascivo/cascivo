import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OtpInput } from './otp-input'

describe('OtpInput', () => {
  it('renders 6 inputs by default', () => {
    render(<OtpInput value="" onValueChange={() => {}} />)
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(6)
  })

  it('renders the specified number of inputs', () => {
    render(<OtpInput length={4} value="" onValueChange={() => {}} />)
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(4)
  })

  it('fills slots from value prop', () => {
    render(<OtpInput value="123" onValueChange={() => {}} />)
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]
    expect(inputs[0]?.value).toBe('1')
    expect(inputs[1]?.value).toBe('2')
    expect(inputs[2]?.value).toBe('3')
    expect(inputs[3]?.value).toBe('')
  })

  it('calls onValueChange when typing', async () => {
    const handler = vi.fn()
    render(<OtpInput value="" onValueChange={handler} />)
    const inputs = screen.getAllByRole('textbox')
    await userEvent.click(inputs[0]!)
    await userEvent.keyboard('5')
    expect(handler).toHaveBeenCalledWith('5')
  })

  it('first input has autocomplete=one-time-code', () => {
    render(<OtpInput value="" onValueChange={() => {}} />)
    const inputs = screen.getAllByRole('textbox')
    expect(inputs[0]).toHaveAttribute('autocomplete', 'one-time-code')
  })

  it('is disabled when disabled prop set', () => {
    render(<OtpInput value="" onValueChange={() => {}} disabled />)
    const inputs = screen.getAllByRole('textbox')
    inputs.forEach((input) => expect(input).toBeDisabled())
  })

  it('has group role with aria-label', () => {
    render(<OtpInput value="" onValueChange={() => {}} />)
    expect(screen.getByRole('group')).toBeTruthy()
  })

  it('each slot has an aria-label', () => {
    render(<OtpInput length={3} value="" onValueChange={() => {}} />)
    expect(screen.getByLabelText('Digit 1')).toBeTruthy()
    expect(screen.getByLabelText('Digit 2')).toBeTruthy()
    expect(screen.getByLabelText('Digit 3')).toBeTruthy()
  })

  it('distributes a valid pasted code across slots', async () => {
    const handler = vi.fn()
    render(<OtpInput value="" onValueChange={handler} />)
    const inputs = screen.getAllByRole('textbox')
    await userEvent.click(inputs[0]!)
    await userEvent.paste('123456')
    expect(handler).toHaveBeenCalledWith('123456')
  })

  it('does not prevent default for an empty or invalid paste', () => {
    render(<OtpInput value="" onValueChange={() => {}} />)
    const input = screen.getAllByRole('textbox')[0]!
    const event = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'clipboardData', {
      value: { getData: () => '' },
    })
    input.dispatchEvent(event)
    // A non-prevented paste keeps the input paste-friendly (Lighthouse audit).
    expect(event.defaultPrevented).toBe(false)
  })
})
