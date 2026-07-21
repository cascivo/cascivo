import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toggle } from './toggle'

describe('Toggle', () => {
  it('renders a switch with the label as its name', () => {
    render(<Toggle label="Notifications" />)
    expect(screen.getByRole('switch', { name: 'Notifications' })).toBeInTheDocument()
  })

  it('defaults to off', () => {
    render(<Toggle label="Notifications" />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  })

  it('respects defaultChecked', () => {
    render(<Toggle label="Notifications" defaultChecked />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('toggles when clicked (uncontrolled)', async () => {
    render(<Toggle label="Notifications" />)
    const toggle = screen.getByRole('switch')
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('stays controlled by the checked prop', async () => {
    const onChange = vi.fn()
    render(<Toggle label="Notifications" checked={false} onChange={onChange} />)
    const toggle = screen.getByRole('switch')
    await userEvent.click(toggle)
    expect(onChange).toHaveBeenCalledWith(true)
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('calls onValueChange with the new checked state', async () => {
    const onValueChange = vi.fn()
    render(<Toggle label="Notifications" checked={false} onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole('switch'))
    expect(onValueChange).toHaveBeenCalledWith(true)
  })

  it('onValueChange takes precedence over the deprecated onChange', async () => {
    const onValueChange = vi.fn()
    const onChange = vi.fn()
    render(
      <Toggle label="N" checked={false} onValueChange={onValueChange} onChange={onChange} />,
    )
    await userEvent.click(screen.getByRole('switch'))
    expect(onValueChange).toHaveBeenCalledWith(true)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not toggle when disabled', async () => {
    render(<Toggle label="Notifications" disabled />)
    const toggle = screen.getByRole('switch')
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })
})
