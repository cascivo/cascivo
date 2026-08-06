import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { VirtualList } from './virtual-list'

afterEach(cleanup)

const rows = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Row ${i}` }))

function renderList(overscan?: number) {
  return render(
    <VirtualList
      items={rows}
      itemHeight={40}
      height={200}
      overscan={overscan ?? 0}
      ariaLabel="Results"
      renderItem={(row) => <span>{row.name}</span>}
    />,
  )
}

/** Scroll the viewport, which is the element carrying role="list". */
function scrollTo(top: number): void {
  const viewport = screen.getByRole('list')
  Object.defineProperty(viewport, 'scrollTop', { value: top, configurable: true })
  act(() => {
    fireEvent.scroll(viewport)
  })
}

describe('VirtualList', () => {
  it('renders only the visible window, not the whole collection', () => {
    renderList()
    // 200px viewport / 40px rows = 5 rows, overscan 0.
    expect(screen.getAllByRole('listitem')).toHaveLength(5)
    expect(screen.getByText('Row 0')).toBeInTheDocument()
    expect(screen.queryByText('Row 900')).not.toBeInTheDocument()
  })

  it('reports the full collection size to assistive technology', () => {
    renderList()
    const first = screen.getAllByRole('listitem')[0]!
    expect(first).toHaveAttribute('aria-setsize', '1000')
    expect(first).toHaveAttribute('aria-posinset', '1')
  })

  it('swaps the window as the viewport scrolls', () => {
    renderList()
    scrollTo(4000) // 4000 / 40 = row 100
    expect(screen.getByText('Row 100')).toBeInTheDocument()
    expect(screen.queryByText('Row 0')).not.toBeInTheDocument()
    expect(screen.getAllByRole('listitem')[0]).toHaveAttribute('aria-posinset', '101')
  })

  it('renders extra rows for the overscan', () => {
    renderList(3)
    // 5 visible + 3 trailing overscan; leading overscan is clamped at the top.
    expect(screen.getAllByRole('listitem')).toHaveLength(8)
  })

  it('sizes the scroll canvas to the full collection', () => {
    renderList()
    const canvas = screen.getByRole('list').firstElementChild as HTMLElement
    expect(canvas.style.blockSize).toBe('40000px')
  })

  it('does not render past the end of the collection', () => {
    render(
      <VirtualList
        items={rows.slice(0, 3)}
        itemHeight={40}
        height={200}
        overscan={0}
        ariaLabel="Short"
        renderItem={(row) => <span>{row.name}</span>}
      />,
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('keeps the scroll viewport reachable by keyboard', () => {
    // Rows hold no focusable content, so the scroll container itself must be in the
    // tab order — axe scrollable-region-focusable, which turned the axe sweep red.
    renderList()
    expect(screen.getByRole('list')).toHaveAttribute('tabindex', '0')
  })

  it('sizes the viewport from the px height', () => {
    renderList()
    expect(screen.getByRole('list')).toHaveStyle({ blockSize: '200px' })
  })
})
