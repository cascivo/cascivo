import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Drawer } from './drawer'

afterEach(cleanup)

describe('Drawer', () => {
  it('is not in the document when closed', () => {
    render(<Drawer title="Filters">content</Drawer>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders a labelled dialog when open', () => {
    render(
      <Drawer open title="Filters">
        content
      </Drawer>,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName('Filters')
  })

  it('closes via the close button (controlled onOpenChange)', async () => {
    const onOpenChange = vi.fn()
    render(
      <Drawer open title="Filters" onOpenChange={onOpenChange}>
        content
      </Drawer>,
    )
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('closes on Escape', async () => {
    const onOpenChange = vi.fn()
    render(
      <Drawer open title="Filters" onOpenChange={onOpenChange}>
        content
      </Drawer>,
    )
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('toggles open uncontrolled', async () => {
    function Harness() {
      return (
        <Drawer defaultOpen title="Filters">
          <button type="button">inside</button>
        </Drawer>
      )
    }
    render(<Harness />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
