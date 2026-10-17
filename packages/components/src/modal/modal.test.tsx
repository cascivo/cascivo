import { describe, it, expect, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './modal'

// Mock dialog methods not implemented in jsdom
HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
  this.setAttribute('open', '')
})
HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
  this.removeAttribute('open')
  this.dispatchEvent(new Event('close'))
})

function drag(target: EventTarget, type: string, x: number, y: number): void {
  act(() => {
    target.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }))
  })
}

describe('Modal', () => {
  it('renders title when open', () => {
    render(<Modal open title="Test Modal" />)
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
  })

  it('drags the dialog by its header when draggable', () => {
    render(<Modal open title="Draggable" draggable />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('data-draggable')
    const header = screen.getByText('Draggable').parentElement as HTMLElement

    drag(header, 'pointerdown', 100, 100)
    drag(window, 'pointermove', 130, 120)
    drag(window, 'pointerup', 130, 120)

    expect(dialog.style.getPropertyValue('--modal-x')).toBe('30px')
    expect(dialog.style.getPropertyValue('--modal-y')).toBe('20px')
  })

  it('attaches no drag offset when not draggable', () => {
    render(<Modal open title="Static" />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).not.toHaveAttribute('data-draggable')
    const header = screen.getByText('Static').parentElement as HTMLElement
    drag(header, 'pointerdown', 0, 0)
    drag(window, 'pointermove', 40, 40)
    expect(dialog.style.getPropertyValue('--modal-x')).toBe('')
  })

  it('renders description', () => {
    render(<Modal open description="Are you sure?" />)
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
  })

  it('renders children', () => {
    render(<Modal open>Body content</Modal>)
    expect(screen.getByText('Body content')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} title="Test" />)
    await userEvent.click(screen.getByRole('button', { name: 'Close modal' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('has correct aria attributes wired to the rendered title/description', () => {
    render(<Modal open title="My Modal" description="My description" />)
    const dialog = screen.getByRole('dialog')
    const labelId = dialog.getAttribute('aria-labelledby')
    const descId = dialog.getAttribute('aria-describedby')
    expect(labelId).toBeTruthy()
    expect(descId).toBeTruthy()
    // The referenced ids must resolve to the actual heading/description elements.
    expect(document.getElementById(labelId!)).toHaveTextContent('My Modal')
    expect(document.getElementById(descId!)).toHaveTextContent('My description')
  })

  it('gives each instance unique aria ids (no duplicate ids across modals)', () => {
    render(
      <>
        <Modal open title="First" description="First desc" />
        <Modal open title="Second" description="Second desc" />
      </>,
    )
    const [first, second] = screen.getAllByRole('dialog')
    expect(first!.getAttribute('aria-labelledby')).not.toBe(second!.getAttribute('aria-labelledby'))
    expect(first!.getAttribute('aria-describedby')).not.toBe(
      second!.getAttribute('aria-describedby'),
    )
    // Every referenced id is unique in the document (aria references unambiguous).
    const ids = [
      first!.getAttribute('aria-labelledby'),
      first!.getAttribute('aria-describedby'),
      second!.getAttribute('aria-labelledby'),
      second!.getAttribute('aria-describedby'),
    ]
    expect(new Set(ids).size).toBe(4)
  })
})

// Astro's `transition:persist` without `Element.moveBefore` (Safari, Firefox) re-inserts the
// persisted island by moving an ancestor. The platform then drops the open dialog from the top
// layer while `isOpen` still says open, so Escape and the backdrop are dead (Astro report R6).
// jsdom has no top layer, so the `showModal` spy stands in for "back in the top layer".
describe('Modal re-insertion', () => {
  it('Modal re-enters the top layer after an ancestor is re-inserted', async () => {
    const onClose = vi.fn()
    const wrapper = document.body.appendChild(document.createElement('div'))
    const showModal = vi.mocked(HTMLDialogElement.prototype.showModal)
    showModal.mockClear()
    render(<Modal open onClose={onClose} title="Persisted" />, { container: wrapper })
    expect(showModal).toHaveBeenCalledTimes(1)

    await act(async () => {
      wrapper.remove()
      document.body.appendChild(wrapper)
    })

    expect(showModal).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('dialog')).toHaveAttribute('open')
    // Restoring through `close()` would fire `close`, and a controlled parent would close it.
    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not touch a closed modal when an ancestor is re-inserted', async () => {
    const wrapper = document.body.appendChild(document.createElement('div'))
    const showModal = vi.mocked(HTMLDialogElement.prototype.showModal)
    showModal.mockClear()
    render(<Modal title="Closed" />, { container: wrapper })

    await act(async () => {
      wrapper.remove()
      document.body.appendChild(wrapper)
    })

    expect(showModal).not.toHaveBeenCalled()
  })
})

describe('Modal ai presence', () => {
  it('flags the dialog for AI content and AI generation', () => {
    const { rerender } = render(
      <Modal open title="Draft" ai>
        Body
      </Modal>,
    )
    const dialog = () => document.querySelector('dialog')
    expect(dialog()).toHaveAttribute('data-ai', '')
    rerender(
      <Modal open title="Draft" ai="generating">
        Body
      </Modal>,
    )
    expect(dialog()).toHaveAttribute('data-ai', 'generating')
    rerender(
      <Modal open title="Draft">
        Body
      </Modal>,
    )
    expect(dialog()).not.toHaveAttribute('data-ai')
  })
})
