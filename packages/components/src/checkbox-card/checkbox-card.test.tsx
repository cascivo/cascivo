import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CheckboxCard } from './checkbox-card'

describe('CheckboxCard', () => {
  it('renders a native checkbox named by its content', () => {
    render(<CheckboxCard title="Backups" description="Daily snapshots" />)
    expect(screen.getByRole('checkbox', { name: /backups/i })).toBeInTheDocument()
  })

  it('toggles on click (uncontrolled)', async () => {
    render(<CheckboxCard title="Backups" defaultChecked />)
    const box = screen.getByRole('checkbox')
    expect(box).toBeChecked()
    await userEvent.click(screen.getByText('Backups'))
    expect(box).not.toBeChecked()
  })

  it('controlled checked + onCheckedChange', async () => {
    const onChange = vi.fn()
    render(<CheckboxCard title="Backups" checked={false} onCheckedChange={onChange} />)
    await userEvent.click(screen.getByText('Backups'))
    expect(onChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole('checkbox')).not.toBeChecked() // parent owns state
  })

  it('disabled blocks interaction', async () => {
    render(<CheckboxCard title="Backups" disabled />)
    await userEvent.click(screen.getByText('Backups'))
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })
})
