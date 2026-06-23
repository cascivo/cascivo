import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Fab, type FabAction } from './fab'

afterEach(cleanup)

const Icon = () => <svg data-testid="icon" />

function dialActions(overrides: Partial<FabAction>[] = []): FabAction[] {
  const base: FabAction[] = [
    { label: 'New post', icon: <Icon />, onSelect: vi.fn() },
    { label: 'New photo', icon: <Icon />, onSelect: vi.fn() },
  ]
  return base.map((a, i) => ({ ...a, ...overrides[i] }))
}

describe('Fab', () => {
  it('renders a single labelled button with no speed-dial', async () => {
    const onClick = vi.fn()
    render(
      <Fab label="Compose" onClick={onClick}>
        <Icon />
      </Fab>,
    )
    const button = screen.getByRole('button', { name: 'Compose' })
    expect(button).not.toHaveAttribute('aria-haspopup')
    await userEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('exposes menu semantics when a speed-dial is provided', () => {
    render(
      <Fab label="Create" actions={dialActions()}>
        <Icon />
      </Fab>,
    )
    const button = screen.getByRole('button', { name: 'Create' })
    expect(button).toHaveAttribute('aria-haspopup', 'menu')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('toggles the speed-dial open and reflects aria-expanded', async () => {
    render(
      <Fab label="Create" actions={dialActions()}>
        <Icon />
      </Fab>,
    )
    const button = screen.getByRole('button', { name: 'Create' })
    await userEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getAllByRole('menuitem')).toHaveLength(2)
  })

  it('invokes an action and collapses on selection', async () => {
    const acts = dialActions()
    const onOpenChange = vi.fn()
    render(
      <Fab label="Create" actions={acts} onOpenChange={onOpenChange}>
        <Icon />
      </Fab>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'New photo' }))
    expect(acts[1]!.onSelect).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it('does not invoke a disabled action', async () => {
    const acts = dialActions([{}, { disabled: true }])
    render(
      <Fab label="Create" actions={acts} defaultOpen>
        <Icon />
      </Fab>,
    )
    const item = screen.getByRole('menuitem', { name: 'New photo' })
    expect(item).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(item)
    expect(acts[1]!.onSelect).not.toHaveBeenCalled()
  })

  it('collapses on Escape (controlled)', async () => {
    const onOpenChange = vi.fn()
    render(
      <Fab label="Create" actions={dialActions()} open onOpenChange={onOpenChange}>
        <Icon />
      </Fab>,
    )
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('moves focus between actions with arrow keys (roving, wraps)', async () => {
    const user = userEvent.setup()
    render(
      <Fab label="Create" actions={dialActions()} defaultOpen>
        <Icon />
      </Fab>,
    )
    const items = screen.getAllByRole('menuitem')
    items[0]!.focus()
    await user.keyboard('{ArrowDown}')
    expect(items[1]).toHaveFocus()
    await user.keyboard('{ArrowDown}') // wraps
    expect(items[0]).toHaveFocus()
  })
})
