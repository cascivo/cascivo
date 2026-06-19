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

  it('has correct aria attributes', () => {
    render(<Modal open title="My Modal" description="My description" />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-labelledby', 'cascade-modal-title')
    expect(dialog).toHaveAttribute('aria-describedby', 'cascade-modal-desc')
  })
})
