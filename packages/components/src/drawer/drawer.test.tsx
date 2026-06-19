import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Drawer } from './drawer'

afterEach(cleanup)

function drag(target: EventTarget, type: string, x: number, y: number): void {
  act(() => {
    target.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }))
  })
}

describe('Drawer', () => {
  it('dismisses when the header is dragged past the threshold (swipeToDismiss)', () => {
    const onOpenChange = vi.fn()
    render(
      <Drawer open side="end" title="Filters" onOpenChange={onOpenChange} swipeToDismiss>
        content
      </Drawer>,
    )
    const header = (screen.getByText('Filters').closest('div') as HTMLElement)
      .parentElement as HTMLElement
    drag(header, 'pointerdown', 0, 0)
    drag(window, 'pointermove', 120, 0)
    drag(window, 'pointerup', 120, 0)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('snaps back without dismissing on a short drag', () => {
    const onOpenChange = vi.fn()
    render(
      <Drawer open side="end" title="Filters" onOpenChange={onOpenChange} swipeToDismiss>
        content
      </Drawer>,
    )
    const header = (screen.getByText('Filters').closest('div') as HTMLElement)
      .parentElement as HTMLElement
    drag(header, 'pointerdown', 0, 0)
    drag(window, 'pointermove', 20, 0)
    drag(window, 'pointerup', 20, 0)
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('attaches no drag dismiss when swipeToDismiss is off', () => {
    const onOpenChange = vi.fn()
    render(
      <Drawer open side="end" title="Filters" onOpenChange={onOpenChange}>
        content
      </Drawer>,
    )
    const header = (screen.getByText('Filters').closest('div') as HTMLElement)
      .parentElement as HTMLElement
    drag(header, 'pointerdown', 0, 0)
    drag(window, 'pointermove', 200, 0)
    drag(window, 'pointerup', 200, 0)
    expect(onOpenChange).not.toHaveBeenCalled()
  })

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
