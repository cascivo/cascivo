import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PasswordInput } from './password-input'

describe('PasswordInput', () => {
  it('renders as password type by default', () => {
    render(<PasswordInput />)
    expect(screen.getByRole('textbox', { hidden: true }) ?? document.querySelector('input')).toBeTruthy()
    const input = document.querySelector('input')
    expect(input).toHaveAttribute('type', 'password')
  })

  it('has a reveal button', () => {
    render(<PasswordInput />)
    const btn = screen.getByRole('button')
    expect(btn).toBeTruthy()
  })

  it('toggles to text type when reveal button clicked', async () => {
    render(<PasswordInput />)
    const btn = screen.getByRole('button')
    await userEvent.click(btn)
    const input = document.querySelector('input')
    expect(input).toHaveAttribute('type', 'text')
  })

  it('toggles back to password type on second click', async () => {
    render(<PasswordInput />)
    const btn = screen.getByRole('button')
    await userEvent.click(btn)
    await userEvent.click(btn)
    const input = document.querySelector('input')
    expect(input).toHaveAttribute('type', 'password')
  })

  it('does not render strength meter by default', () => {
    render(<PasswordInput />)
    expect(document.querySelector('[data-strength]')).toBeNull()
  })

  it('renders strength meter when showStrengthMeter is true', () => {
    render(<PasswordInput showStrengthMeter defaultValue="abc" />)
    expect(document.querySelector('[data-strength]')).toBeTruthy()
  })

  it('shows weak strength for short simple password', () => {
    render(<PasswordInput showStrengthMeter defaultValue="abc" />)
    expect(document.querySelector('[data-strength="weak"]')).toBeTruthy()
  })

  it('shows strong strength for complex password', () => {
    render(<PasswordInput showStrengthMeter defaultValue="Abc123!@#defg" />)
    expect(document.querySelector('[data-strength="strong"]')).toBeTruthy()
  })

  it('renders 4 strength segments', () => {
    render(<PasswordInput showStrengthMeter defaultValue="test" />)
    const segments = document.querySelectorAll('[class*="strength-segment"]')
    expect(segments).toHaveLength(4)
  })

  it('accepts size prop', () => {
    render(<PasswordInput size="lg" />)
    expect(document.querySelector('[data-size="lg"]')).toBeTruthy()
  })

  it('calls onChange when value changes', async () => {
    const handler = vi.fn()
    render(<PasswordInput onChange={handler} />)
    const input = document.querySelector('input')!
    await userEvent.type(input, 'hello')
    expect(handler).toHaveBeenCalled()
  })

  it('is disabled when disabled prop is set', () => {
    render(<PasswordInput disabled />)
    const input = document.querySelector('input')
    expect(input).toBeDisabled()
  })

  it('uses custom labels', () => {
    render(<PasswordInput labels={{ reveal: 'Show it', hide: 'Hide it' }} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Show it')
  })
})
