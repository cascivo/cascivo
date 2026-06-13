import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChartFrame } from './chart-frame'
import type { TooltipModel } from './data-point'

describe('ChartFrame', () => {
  it('renders svg with role="img"', () => {
    render(
      <ChartFrame title="Test chart" height={200}>
        {() => null}
      </ChartFrame>,
    )
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('sets aria-label from title', () => {
    render(
      <ChartFrame title="Revenue chart" height={200}>
        {() => null}
      </ChartFrame>,
    )
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Revenue chart')
  })

  it('renders desc element for description', () => {
    render(
      <ChartFrame title="T" description="Monthly revenue" height={200}>
        {() => null}
      </ChartFrame>,
    )
    expect(screen.getByText('Monthly revenue')).toBeInTheDocument()
  })

  it('emits data-plain attribute when plain is true', () => {
    const { container } = render(
      <ChartFrame title="T" height={200} plain>
        {() => null}
      </ChartFrame>,
    )
    expect((container.firstChild as HTMLElement).hasAttribute('data-plain')).toBe(true)
  })

  it('does not emit data-plain when plain is absent', () => {
    const { container } = render(
      <ChartFrame title="T" height={200}>
        {() => null}
      </ChartFrame>,
    )
    expect((container.firstChild as HTMLElement).hasAttribute('data-plain')).toBe(false)
  })

  it('renders fallback content', () => {
    render(
      <ChartFrame
        title="T"
        height={200}
        fallback={
          <table>
            <tbody>
              <tr>
                <td>Data</td>
              </tr>
            </tbody>
          </table>
        }
      >
        {() => null}
      </ChartFrame>,
    )
    expect(screen.getByText('Data')).toBeInTheDocument()
  })

  it('does not render aria-live region without tooltip prop', () => {
    render(
      <ChartFrame title="T" height={200}>
        {() => null}
      </ChartFrame>,
    )
    expect(document.querySelector('[aria-live="polite"]')).toBeNull()
  })

  it('renders aria-live region when tooltip prop is provided', () => {
    render(
      <ChartFrame title="T" height={200} tooltip={{ points: [] }}>
        {() => null}
      </ChartFrame>,
    )
    expect(document.querySelector('[aria-live="polite"]')).toBeInTheDocument()
  })

  it('renders focusable layer with role="application" when tooltip prop is provided', () => {
    render(
      <ChartFrame title="T" height={200} tooltip={{ points: [] }}>
        {() => null}
      </ChartFrame>,
    )
    const layer = screen.getByRole('application')
    expect(layer).toBeInTheDocument()
    expect(layer).toHaveAttribute('tabindex', '0')
  })
})

describe('ChartFrame keyboard navigation', () => {
  const tooltip: TooltipModel = {
    points: [
      { id: 'p0', cx: 10, cy: 10, label: 'Jan', value: 100 },
      { id: 'p1', cx: 20, cy: 20, label: 'Feb', value: 200 },
      { id: 'p2', cx: 30, cy: 30, label: 'Mar', value: 300 },
    ],
  }

  function getLayer() {
    return screen.getByRole('application')
  }

  function getLiveRegion() {
    return document.querySelector('[aria-live="polite"]') as HTMLElement
  }

  it('ArrowRight advances focused point and announces it', async () => {
    render(
      <ChartFrame title="T" height={200} tooltip={tooltip}>
        {() => null}
      </ChartFrame>,
    )
    const layer = getLayer()
    // Focus the layer → focusedIndex becomes 0
    act(() => {
      fireEvent.focus(layer)
    })
    expect(getLiveRegion().textContent).toBe('Jan: 100')

    // ArrowRight → index 1
    act(() => {
      fireEvent.keyDown(layer, { key: 'ArrowRight' })
    })
    expect(getLiveRegion().textContent).toBe('Feb: 200')
  })

  it('ArrowLeft decrements focused point', async () => {
    render(
      <ChartFrame title="T" height={200} tooltip={tooltip}>
        {() => null}
      </ChartFrame>,
    )
    const layer = getLayer()
    act(() => {
      fireEvent.focus(layer)
      fireEvent.keyDown(layer, { key: 'ArrowRight' })
    })
    expect(getLiveRegion().textContent).toBe('Feb: 200')

    act(() => {
      fireEvent.keyDown(layer, { key: 'ArrowLeft' })
    })
    expect(getLiveRegion().textContent).toBe('Jan: 100')
  })

  it('ArrowLeft at index 0 stays at 0 (clamps)', () => {
    render(
      <ChartFrame title="T" height={200} tooltip={tooltip}>
        {() => null}
      </ChartFrame>,
    )
    const layer = getLayer()
    act(() => {
      fireEvent.focus(layer)
    })
    expect(getLiveRegion().textContent).toBe('Jan: 100')

    act(() => {
      fireEvent.keyDown(layer, { key: 'ArrowLeft' })
    })
    expect(getLiveRegion().textContent).toBe('Jan: 100')
  })

  it('ArrowRight at last index stays at last (clamps)', () => {
    render(
      <ChartFrame title="T" height={200} tooltip={tooltip}>
        {() => null}
      </ChartFrame>,
    )
    const layer = getLayer()
    act(() => {
      fireEvent.focus(layer)
      fireEvent.keyDown(layer, { key: 'End' })
    })
    expect(getLiveRegion().textContent).toBe('Mar: 300')

    act(() => {
      fireEvent.keyDown(layer, { key: 'ArrowRight' })
    })
    expect(getLiveRegion().textContent).toBe('Mar: 300')
  })

  it('Home jumps to first point', () => {
    render(
      <ChartFrame title="T" height={200} tooltip={tooltip}>
        {() => null}
      </ChartFrame>,
    )
    const layer = getLayer()
    act(() => {
      fireEvent.focus(layer)
      fireEvent.keyDown(layer, { key: 'ArrowRight' })
      fireEvent.keyDown(layer, { key: 'ArrowRight' })
    })
    expect(getLiveRegion().textContent).toBe('Mar: 300')

    act(() => {
      fireEvent.keyDown(layer, { key: 'Home' })
    })
    expect(getLiveRegion().textContent).toBe('Jan: 100')
  })

  it('End jumps to last point', () => {
    render(
      <ChartFrame title="T" height={200} tooltip={tooltip}>
        {() => null}
      </ChartFrame>,
    )
    const layer = getLayer()
    act(() => {
      fireEvent.focus(layer)
    })
    expect(getLiveRegion().textContent).toBe('Jan: 100')

    act(() => {
      fireEvent.keyDown(layer, { key: 'End' })
    })
    expect(getLiveRegion().textContent).toBe('Mar: 300')
  })

  it('Escape clears focus and empties aria-live', () => {
    render(
      <ChartFrame title="T" height={200} tooltip={tooltip}>
        {() => null}
      </ChartFrame>,
    )
    const layer = getLayer()
    act(() => {
      fireEvent.focus(layer)
    })
    expect(getLiveRegion().textContent).toBe('Jan: 100')

    act(() => {
      fireEvent.keyDown(layer, { key: 'Escape' })
    })
    expect(getLiveRegion().textContent).toBe('')
  })
})
