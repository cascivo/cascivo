import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PasswordInput } from './password-input'

function getInput() {
  return document.querySelector('input') as HTMLInputElement
}

describe('PasswordInput', () => {
  it('renders as password type by default', () => {
    render(<PasswordInput />)
    expect(getInput()).toHaveAttribute('type', 'password')
  })

  it('has a reveal button', () => {
    render(<PasswordInput />)
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('reveal button has correct aria-label', () => {
    render(<PasswordInput />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Show password')
  })

  it('toggles to text type when reveal button clicked', async () => {
    render(<PasswordInput />)
    await userEvent.click(screen.getByRole('button'))
    expect(getInput()).toHaveAttribute('type', 'text')
  })

  it('changes aria-label after reveal', async () => {
    render(<PasswordInput />)
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Hide password')
  })

  it('toggles back to password type on second click', async () => {
    render(<PasswordInput />)
    await userEvent.click(screen.getByRole('button'))
    await userEvent.click(screen.getByRole('button'))
    expect(getInput()).toHaveAttribute('type', 'password')
  })

  it('does not render strength meter by default', () => {
    const { container } = render(<PasswordInput />)
    expect(container.querySelector('[data-strength]')).toBeNull()
  })

  it('renders strength meter when showStrengthMeter is true', () => {
    const { container } = render(<PasswordInput showStrengthMeter defaultValue="abc" />)
    expect(container.querySelector('[data-strength]')).toBeTruthy()
  })

  it('shows weak strength for short simple password', () => {
    const { container } = render(<PasswordInput showStrengthMeter defaultValue="abc" />)
    expect(container.querySelector('[data-strength="weak"]')).toBeTruthy()
  })

  it('shows strong strength for complex password', () => {
    const { container } = render(<PasswordInput showStrengthMeter defaultValue="Abc123!@#defg" />)
    expect(container.querySelector('[data-strength="strong"]')).toBeTruthy()
  })

  it('renders 4 strength segments', () => {
    const { container } = render(<PasswordInput showStrengthMeter defaultValue="test" />)
    expect(container.querySelectorAll('[class*="strength-segment"]')).toHaveLength(4)
  })

  it('accepts size prop', () => {
    const { container } = render(<PasswordInput size="lg" />)
    expect(container.querySelector('[data-size="lg"]')).toBeTruthy()
  })

  it('calls onChange when value changes', async () => {
    const handler = vi.fn()
    render(<PasswordInput onChange={handler} />)
    await userEvent.type(getInput(), 'hello')
    expect(handler).toHaveBeenCalled()
  })

  it('is disabled when disabled prop is set', () => {
    render(<PasswordInput disabled />)
    expect(getInput()).toBeDisabled()
  })

  it('uses custom labels', () => {
    render(<PasswordInput labels={{ reveal: 'Show it', hide: 'Hide it' }} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Show it')
  })
})
