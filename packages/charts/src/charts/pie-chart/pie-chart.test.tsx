import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { PieChart } from './pie-chart'

const data = [
  { id: 'a', label: 'Alpha', value: 40 },
  { id: 'b', label: 'Beta', value: 35 },
  { id: 'c', label: 'Gamma', value: 25 },
]

describe('PieChart', () => {
  it('renders without crash', () => {
    render(<PieChart data={data} title="Pie" />)
    expect(screen.getByRole('img', { name: 'Pie' })).toBeTruthy()
  })

  it('renders one path per slice', () => {
    const { container } = render(<PieChart data={data} title="Pie" />)
    const paths = container.querySelectorAll('path[data-series]')
    expect(paths).toHaveLength(3)
  })

  it('renders donut variant', () => {
    const { container } = render(<PieChart data={data} title="Donut" donut />)
    expect(container.querySelectorAll('path[data-series]').length).toBe(3)
  })

  it('renders fallback table with percent', () => {
    const { container } = render(<PieChart data={data} title="Pie" />)
    const table = container.querySelector('table')
    expect(table).toBeTruthy()
    expect(table?.textContent).toContain('40')
    expect(table?.textContent).toContain('%')
  })

  it('renders legend', () => {
    render(<PieChart data={data} title="Pie" />)
    expect(screen.getAllByText('Alpha').length).toBeGreaterThan(0)
  })

  it('renders aria-live region for tooltip', () => {
    render(<PieChart data={data} title="Pie" />)
    expect(document.querySelector('[aria-live="polite"]')).toBeTruthy()
  })

  describe('donut center content (T2)', () => {
    it('renders centerValue and centerLabel as text in a donut', () => {
      render(
        <PieChart
          data={data}
          title="Donut"
          donut
          size={200}
          centerValue="42"
          centerLabel="Total"
        />,
      )
      expect(screen.getByText('42')).toBeTruthy()
      expect(screen.getByText('Total')).toBeTruthy()
    })

    it('renders no center text without center props', () => {
      const { container } = render(<PieChart data={data} title="Donut" donut size={200} />)
      expect(container.querySelector('[data-center]')).toBeNull()
      expect(container.querySelector('[data-center-slot]')).toBeNull()
    })

    it('renders centerSlot and gives it precedence over value/label', () => {
      const { container } = render(
        <PieChart
          data={data}
          title="Donut"
          donut
          size={200}
          centerValue="42"
          centerLabel="Total"
          centerSlot={<span>SLOT</span>}
        />,
      )
      expect(container.querySelector('[data-center-slot]')).toBeTruthy()
      expect(screen.getByText('SLOT')).toBeTruthy()
      expect(screen.queryByText('42')).toBeNull()
    })

    it('ignores center props on a non-donut pie', () => {
      const { container } = render(
        <PieChart data={data} title="Pie" size={200} centerValue="42" centerLabel="Total" />,
      )
      expect(container.querySelector('[data-center]')).toBeNull()
      expect(screen.queryByText('42')).toBeNull()
    })
  })

  describe('donut thickness / innerRadius (T2)', () => {
    // size=200 → w=h=200, cx=cy=100, outerR = min(100,100) - 8 = 92.
    it('reflects thickness as outerR - thickness in the slice path', () => {
      const { container } = render(
        <PieChart data={data} title="Donut" donut size={200} thickness={20} />,
      )
      const path = container.querySelector('path[data-series]')!.getAttribute('d')!
      // innerR = 92 - 20 = 72 → arcPath emits an "A72,72" inner arc.
      expect(path).toContain('A72,72')
    })

    it('honors innerRadius over thickness', () => {
      const { container } = render(
        <PieChart data={data} title="Donut" donut size={200} thickness={20} innerRadius={40} />,
      )
      const path = container.querySelector('path[data-series]')!.getAttribute('d')!
      expect(path).toContain('A40,40')
    })

    it('default donut inner radius stays the 0.6 ratio (quantized for SSR)', () => {
      const { container } = render(<PieChart data={data} title="Donut" donut size={200} />)
      const path = container.querySelector('path[data-series]')!.getAttribute('d')!
      // 92 * 0.6 = 55.199999… → quantized to 2 decimals so SSR/client emit an
      // identical `d` string (see `quantize` in engine/shape.ts).
      expect(path).toContain('A55.2,55.2')
    })

    it('clamps oversized thickness without inverting the arc (no NaN)', () => {
      const { container } = render(
        <PieChart data={data} title="Donut" donut size={200} thickness={500} />,
      )
      const paths = container.querySelectorAll('path[data-series]')
      paths.forEach((p) => expect(p.getAttribute('d')).not.toContain('NaN'))
    })
  })

  describe('size shorthand (T2)', () => {
    it('renders a square frame from size', () => {
      const { container } = render(<PieChart data={data} title="Pie" size={140} />)
      expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 140 140')
    })

    it('lets explicit width/height win over size', () => {
      const { container } = render(
        <PieChart data={data} title="Pie" size={140} width={200} height={120} />,
      )
      expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 200 120')
    })
  })

  describe('per-datum color override (T5, C1)', () => {
    const mixed = [
      { id: 'a', label: 'Alpha', value: 40, color: 'rebeccapurple' },
      { id: 'b', label: 'Beta', value: 60 },
    ]

    it('uses the datum color for its slice and falls back to the palette otherwise', () => {
      const { container } = render(<PieChart data={mixed} title="Pie" />)
      const paths = container.querySelectorAll('path[data-series]')
      expect(paths[0]?.getAttribute('fill')).toBe('rebeccapurple')
      // The uncolored datum keeps the positional palette var.
      expect(paths[1]?.getAttribute('fill')).toBe('var(--cascivo-chart-2)')
    })

    it('mirrors the override in the legend swatch', () => {
      const { container } = render(<PieChart data={mixed} title="Pie" />)
      const swatch = container.querySelector('button[aria-pressed] span[aria-hidden="true"]')
      expect((swatch as HTMLElement | null)?.style.background).toBe('rebeccapurple')
    })
  })

  describe('empty state (T3)', () => {
    it('renders a visible "No data" placeholder and no slice paths when empty', () => {
      const { container } = render(<PieChart data={[]} title="Empty" />)
      const placeholder = container.querySelector('[data-empty]')
      expect(placeholder?.textContent).toBe('No data')
      expect(container.querySelectorAll('path[data-series]')).toHaveLength(0)
    })

    it('renders no NaN path with empty data', () => {
      const { container } = render(<PieChart data={[]} title="Empty" donut />)
      expect(container.querySelector('svg')?.innerHTML).not.toContain('NaN')
    })

    it('keeps the a11y fallback table when empty', () => {
      const { container } = render(<PieChart data={[]} title="Empty" />)
      expect(container.querySelector('table')).toBeTruthy()
    })

    it('honors a custom emptyLabel', () => {
      const { container } = render(
        <PieChart data={[]} title="Empty" emptyLabel="Nothing tracked yet" />,
      )
      expect(container.querySelector('[data-empty]')?.textContent).toBe('Nothing tracked yet')
    })
  })

  describe('percentage tooltip (T3)', () => {
    const pct = [
      { id: 'a', label: 'A', value: 60, color: 'rebeccapurple' },
      { id: 'b', label: 'B', value: 40 },
    ]

    it('default tooltip announces "value (pct%)" via aria-live', () => {
      render(<PieChart data={pct} title="Share" />)
      const layer = screen.getByRole('application')
      act(() => {
        fireEvent.focus(layer)
      })
      expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe('60 (60%)')
    })

    it('renders the visible tooltip text in the slice color', () => {
      render(<PieChart data={pct} title="Share" />)
      const layer = screen.getByRole('application')
      act(() => {
        fireEvent.focus(layer)
      })
      const tooltip = screen.getByRole('tooltip')
      expect(tooltip.textContent).toBe('60 (60%)')
      expect(tooltip.querySelector('span')?.style.color).toBe('rebeccapurple')
    })

    it('lets tooltipFormat override the default', () => {
      render(<PieChart data={pct} title="Share" tooltipFormat={(p) => p.label.toUpperCase()} />)
      const layer = screen.getByRole('application')
      act(() => {
        fireEvent.focus(layer)
      })
      expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe('A')
    })
  })

  describe('plain mode', () => {
    it('renders no legend', () => {
      const { container } = render(<PieChart data={data} title="Plain" plain />)
      expect(container.querySelectorAll('button[aria-pressed]')).toHaveLength(0)
    })

    it('keeps role=img and fallback table in plain mode', () => {
      const { container } = render(<PieChart data={data} title="Plain" plain />)
      expect(container.querySelector('svg[role="img"]')).toBeTruthy()
      expect(container.querySelector('table')).toBeTruthy()
    })

    it('respects explicit width/height in plain mode', () => {
      const { container } = render(
        <PieChart data={data} title="Plain" plain width={120} height={32} />,
      )
      const svg = container.querySelector('svg')
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 32')
    })
  })
})
