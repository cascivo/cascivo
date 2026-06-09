import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from './checkbox'

describe('Checkbox', () => {
  it('renders with a label', () => {
    render(<Checkbox label="Accept terms" />)
    expect(screen.getByLabelText('Accept terms')).toBeInTheDocument()
  })

  it('toggles checked state on click', async () => {
    render(<Checkbox label="Accept" />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
    await userEvent.click(checkbox)
    expect(checkbox).toBeChecked()
  })

  it('reflects the indeterminate property', () => {
    render(<Checkbox label="Select all" indeterminate />)
    expect(screen.getByRole<HTMLInputElement>('checkbox').indeterminate).toBe(true)
  })

  it('is disabled when the disabled prop is set', () => {
    render(<Checkbox label="Accept" disabled />)
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })

  it('calls onChange', async () => {
    const handler = vi.fn()
    render(<Checkbox label="Accept" onChange={handler} />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(handler).toHaveBeenCalledOnce()
  })
})
