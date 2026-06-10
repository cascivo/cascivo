import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OverflowMenu } from './overflow-menu'

const items = [
  { label: 'Edit', value: 'edit' },
  { label: 'Duplicate', value: 'duplicate', disabled: true },
  { label: 'Delete', value: 'delete', destructive: true },
]

describe('OverflowMenu', () => {
  it('renders a kebab trigger with the default accessible label', () => {
    render(<OverflowMenu items={items} />)
    const trigger = screen.getByRole('button', { name: 'More actions' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveAttribute('data-size', 'md')
  })

  it('supports a custom aria label and size', () => {
    render(<OverflowMenu items={items} ariaLabel="Row actions" size="sm" />)
    expect(screen.getByRole('button', { name: 'Row actions' })).toHaveAttribute('data-size', 'sm')
  })

  it('opens the menu on trigger click', async () => {
    render(<OverflowMenu items={items} />)
    await userEvent.click(screen.getByRole('button', { name: 'More actions' }))
    expect(screen.getByRole('menu')).toHaveAttribute('data-state', 'open')
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument()
  })

  it('defaults to bottom-end placement', () => {
    render(<OverflowMenu items={items} />)
    expect(screen.getByRole('menu')).toHaveAttribute('data-placement', 'bottom-end')
  })

  it('calls onSelect with the item value and closes', async () => {
    const onSelect = vi.fn()
    render(<OverflowMenu items={items} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'More actions' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))
    expect(onSelect).toHaveBeenCalledWith('edit')
    await waitFor(() => expect(screen.getByRole('menu')).toHaveAttribute('data-state', 'closed'))
  })

  it('does not select disabled items', async () => {
    const onSelect = vi.fn()
    render(<OverflowMenu items={items} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'More actions' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Duplicate' }))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('marks destructive items for CSS styling', async () => {
    render(<OverflowMenu items={items} />)
    await userEvent.click(screen.getByRole('button', { name: 'More actions' }))
    const destructiveItem = screen.getByRole('menuitem', { name: 'Delete' })
    expect(destructiveItem.querySelector('[class*="destructive-flag"]')).not.toBeNull()
    const plainItem = screen.getByRole('menuitem', { name: 'Edit' })
    expect(plainItem.querySelector('[class*="destructive-flag"]')).toBeNull()
  })

  it('supports keyboard navigation and selection', async () => {
    const onSelect = vi.fn()
    render(<OverflowMenu items={items} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'More actions' }))
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onSelect).toHaveBeenCalledWith('delete')
  })

  it('does not open when disabled', async () => {
    render(<OverflowMenu items={items} disabled />)
    const trigger = screen.getByRole('button', { name: 'More actions' })
    expect(trigger).toBeDisabled()
    await userEvent.click(trigger)
    expect(screen.getByRole('menu')).toHaveAttribute('data-state', 'closed')
  })
})
