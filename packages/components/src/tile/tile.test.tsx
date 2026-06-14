import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Tile } from './tile'

afterEach(cleanup)

describe('Tile', () => {
  it('renders a radio by default', () => {
    render(<Tile value="a">Option A</Tile>)
    const tile = screen.getByRole('radio', { name: /option a/i })
    expect(tile).toHaveAttribute('aria-checked', 'false')
  })

  it('renders a checkbox when multi', () => {
    render(
      <Tile value="a" selectable="multi">
        Option A
      </Tile>,
    )
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('selects on click (uncontrolled single) and calls onSelect', async () => {
    const onSelect = vi.fn()
    render(
      <Tile value="a" onSelect={onSelect}>
        Option A
      </Tile>,
    )
    const tile = screen.getByRole('radio')
    await userEvent.click(tile)
    expect(tile).toHaveAttribute('aria-checked', 'true')
    expect(onSelect).toHaveBeenCalledWith('a')
  })

  it('toggles off in multi mode', async () => {
    render(
      <Tile value="a" selectable="multi" defaultSelected>
        Option A
      </Tile>,
    )
    const tile = screen.getByRole('checkbox')
    expect(tile).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(tile)
    expect(tile).toHaveAttribute('aria-checked', 'false')
  })

  it('toggles via keyboard (Space)', async () => {
    render(<Tile value="a">Option A</Tile>)
    const tile = screen.getByRole('radio')
    tile.focus()
    await userEvent.keyboard(' ')
    expect(tile).toHaveAttribute('aria-checked', 'true')
  })

  it('does not toggle when disabled', async () => {
    const onSelect = vi.fn()
    render(
      <Tile value="a" disabled onSelect={onSelect}>
        Option A
      </Tile>,
    )
    await userEvent.click(screen.getByRole('radio'))
    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.getByRole('radio')).toHaveAttribute('aria-checked', 'false')
  })

  it('controlled selected respects the parent', async () => {
    const onSelect = vi.fn()
    render(
      <Tile value="a" selectable="multi" selected={false} onSelect={onSelect}>
        Option A
      </Tile>,
    )
    const tile = screen.getByRole('checkbox')
    await userEvent.click(tile)
    expect(onSelect).toHaveBeenCalledWith('a')
    expect(tile).toHaveAttribute('aria-checked', 'false') // parent owns state
  })
})
