import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ReorderList, type ReorderItem } from './reorder-list'

afterEach(cleanup)

const items: ReorderItem[] = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Bravo' },
  { id: 'c', label: 'Charlie' },
]

function handle(name: string): HTMLElement {
  return screen.getByRole('button', { name: `Reorder ${name}` })
}

/** Render controlled, tracking the order the component reports back. */
function renderControlled(initial = items) {
  let current = initial
  const onValueChange = vi.fn((next: ReorderItem[]) => {
    current = next
    rerender(<ReorderList value={current} onValueChange={onValueChange} />)
  })
  const { rerender } = render(<ReorderList value={current} onValueChange={onValueChange} />)
  return { onValueChange, order: () => current.map((i) => i.id) }
}

describe('ReorderList', () => {
  it('renders a labelled handle per row', () => {
    renderControlled()
    expect(handle('Alpha')).toBeInTheDocument()
    expect(handle('Charlie')).toBeInTheDocument()
  })

  it('picks a row up on Space and marks the handle pressed', () => {
    renderControlled()
    fireEvent.keyDown(handle('Alpha'), { key: ' ' })
    expect(handle('Alpha')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('Picked up Alpha. Position 1 of 3.')
  })

  it('moves a held row with the arrow keys and announces the new position', () => {
    const { order } = renderControlled()
    fireEvent.keyDown(handle('Alpha'), { key: ' ' })
    fireEvent.keyDown(handle('Alpha'), { key: 'ArrowDown' })
    expect(order()).toEqual(['b', 'a', 'c'])
    expect(screen.getByRole('status')).toHaveTextContent('Moved Alpha to position 2 of 3.')
  })

  it('ignores arrow keys when no row is held', () => {
    const { onValueChange, order } = renderControlled()
    fireEvent.keyDown(handle('Alpha'), { key: 'ArrowDown' })
    expect(onValueChange).not.toHaveBeenCalled()
    expect(order()).toEqual(['a', 'b', 'c'])
  })

  it('does not move past the ends of the list', () => {
    const { onValueChange } = renderControlled()
    fireEvent.keyDown(handle('Alpha'), { key: ' ' })
    fireEvent.keyDown(handle('Alpha'), { key: 'ArrowUp' })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('restores the pre-grab order on Escape', () => {
    const { order } = renderControlled()
    fireEvent.keyDown(handle('Alpha'), { key: ' ' })
    fireEvent.keyDown(handle('Alpha'), { key: 'ArrowDown' })
    fireEvent.keyDown(handle('Alpha'), { key: 'ArrowDown' })
    expect(order()).toEqual(['b', 'c', 'a'])

    fireEvent.keyDown(handle('Alpha'), { key: 'Escape' })
    expect(order()).toEqual(['a', 'b', 'c'])
    expect(screen.getByRole('status')).toHaveTextContent('Reordering cancelled')
  })

  it('drops on a second Space and clears the pressed state', () => {
    renderControlled()
    fireEvent.keyDown(handle('Alpha'), { key: ' ' })
    fireEvent.keyDown(handle('Alpha'), { key: ' ' })
    expect(handle('Alpha')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('status')).toHaveTextContent('Dropped Alpha')
  })

  it('announces a non-string label using its name', () => {
    render(
      <ReorderList
        value={[{ id: 'a', label: <strong>Alpha</strong>, name: 'Alpha' }]}
        onValueChange={vi.fn()}
      />,
    )
    fireEvent.keyDown(handle('Alpha'), { key: ' ' })
    expect(screen.getByRole('status')).toHaveTextContent('Picked up Alpha')
  })

  it('disables every handle and never reorders when disabled', () => {
    const onValueChange = vi.fn()
    render(<ReorderList value={items} onValueChange={onValueChange} disabled />)
    expect(handle('Alpha')).toBeDisabled()
    fireEvent.keyDown(handle('Alpha'), { key: ' ' })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('reorders on a pointer drag across a row boundary', () => {
    const { order } = renderControlled()
    const rows = document.querySelectorAll<HTMLElement>('[data-reorder-row]')
    // jsdom gives every element a zero-size rect, so pin the geometry the drag reads.
    rows.forEach((row, i) => {
      row.getBoundingClientRect = () => ({ top: i * 40, bottom: i * 40 + 40 }) as DOMRect
    })

    fireEvent.pointerDown(handle('Alpha'))
    act(() => {
      window.dispatchEvent(new MouseEvent('pointermove', { clientY: 50, bubbles: true }))
    })
    expect(order()).toEqual(['b', 'a', 'c'])
  })
})
