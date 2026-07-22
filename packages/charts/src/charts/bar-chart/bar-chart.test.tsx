import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { BarChart } from './bar-chart'
import { toStackedSeries } from '../../engine/stacked'

const series = [
  {
    id: 'a',
    label: 'Q1',
    data: [
      { x: 'Jan', y: 10 },
      { x: 'Feb', y: 20 },
    ],
  },
  {
    id: 'b',
    label: 'Q2',
    data: [
      { x: 'Jan', y: 5 },
      { x: 'Feb', y: 15 },
    ],
  },
]
const x = (d: { x: string; y: number }) => d.x
const y = (d: { x: string; y: number }) => d.y

describe('BarChart', () => {
  it('honors a per-series y accessor over the chart-level y', () => {
    type Row = { cat: string; requests: number; errors: number }
    const rows: Row[] = [
      { cat: 'A', requests: 100, errors: 5 },
      { cat: 'B', requests: 120, errors: 9 },
    ]
    const { container } = render(
      <BarChart
        title="Multi-field"
        series={[
          { id: 'req', label: 'Requests', data: rows, y: (d) => d.requests },
          { id: 'err', label: 'Errors', data: rows, y: (d) => d.errors },
        ]}
        x={(d: Row) => d.cat}
        y={(d: Row) => d.requests}
      />,
    )
    // Fallback table first row: [category, requests, errors].
    const cells = [...container.querySelectorAll('tbody tr:first-child td')].map(
      (c) => c.textContent,
    )
    expect(cells).toEqual(['A', '100', '5'])
  })

  it('renders without crash', () => {
    render(<BarChart series={series} x={x} y={y} title="Bar" />)
    expect(screen.getByRole('img', { name: 'Bar' })).toBeTruthy()
  })

  it('renders rects for each bar', () => {
    const { container } = render(<BarChart series={series} x={x} y={y} title="Bar" />)
    const rects = container.querySelectorAll('rect[data-series]')
    // 2 series × 2 categories = 4 bars
    expect(rects.length).toBe(4)
  })

  it('renders horizontal orientation', () => {
    const { container } = render(
      <BarChart series={series} x={x} y={y} title="Bar" orientation="horizontal" />,
    )
    expect(container.querySelectorAll('rect[data-series]').length).toBe(4)
  })

  it('renders stacked mode', () => {
    const { container } = render(
      <BarChart series={series} x={x} y={y} title="Stacked" mode="stacked" />,
    )
    expect(container.querySelectorAll('rect[data-series]').length).toBe(4)
  })

  it('renders fallback table', () => {
    const { container } = render(<BarChart series={series} x={x} y={y} title="Bar" />)
    expect(container.querySelector('table')).toBeTruthy()
  })

  it('renders aria-live region when tooltip is enabled', () => {
    render(<BarChart series={series} x={x} y={y} title="Bar" tooltip />)
    expect(document.querySelector('[aria-live="polite"]')).toBeTruthy()
  })

  describe('per-series color override (T5, C7)', () => {
    const colored = [
      { id: 'a', label: 'Done', color: 'rebeccapurple', data: [{ x: 'Jan', y: 10 }] },
      { id: 'b', label: 'Todo', data: [{ x: 'Jan', y: 5 }] },
    ]

    it('uses the series color for its stacked layer rects, palette otherwise', () => {
      const { container } = render(
        <BarChart series={colored} x={x} y={y} title="Stacked" mode="stacked" />,
      )
      expect(container.querySelector('rect[data-series="a"]')?.getAttribute('fill')).toBe(
        'rebeccapurple',
      )
      expect(container.querySelector('rect[data-series="b"]')?.getAttribute('fill')).toBe(
        'var(--cascivo-chart-2)',
      )
    })

    it('mirrors the override in the legend swatch', () => {
      const { container } = render(<BarChart series={colored} x={x} y={y} title="Stacked" />)
      const swatch = container.querySelector('button[aria-pressed] span[aria-hidden="true"]')
      expect((swatch as HTMLElement | null)?.style.background).toBe('rebeccapurple')
    })
  })

  describe('stacked tooltip (T4)', () => {
    // Stacked: Jan → Q1 10 + Q2 5 = 15; first focusable point is Q1/Jan.
    it('default announces "label · total" + per-layer breakdown via aria-live', () => {
      render(<BarChart series={series} x={x} y={y} title="Stacked" mode="stacked" tooltip />)
      const layer = screen.getByRole('application')
      act(() => {
        fireEvent.focus(layer)
      })
      expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe(
        'Jan · 15 — Q1: 10, Q2: 5',
      )
    })

    it('renders a structured visible tooltip with header and segment lines', () => {
      render(<BarChart series={series} x={x} y={y} title="Stacked" mode="stacked" tooltip />)
      const layer = screen.getByRole('application')
      act(() => {
        fireEvent.focus(layer)
      })
      const tooltip = screen.getByRole('tooltip')
      expect(tooltip.querySelector('[data-tooltip-header]')?.textContent).toBe('Jan · 15')
      expect(tooltip.textContent).toContain('Q1: 10')
      expect(tooltip.textContent).toContain('Q2: 5')
    })

    it('lets tooltipFormat override the stacked default', () => {
      render(
        <BarChart
          series={series}
          x={x}
          y={y}
          title="Stacked"
          mode="stacked"
          tooltip
          tooltipFormat={(p) => `${p.label}=${p.value}`}
        />,
      )
      const layer = screen.getByRole('application')
      act(() => {
        fireEvent.focus(layer)
      })
      // Custom formatter → no structured breakdown; p.value is the focused layer value (10).
      expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe('Jan=10')
    })
  })

  describe('x-label thinning (T4)', () => {
    const wide = [
      {
        id: 'a',
        label: 'Q',
        data: [
          { x: 'Jan', y: 10 },
          { x: 'Feb', y: 20 },
          { x: 'Mar', y: 30 },
          { x: 'Apr', y: 40 },
        ],
      },
    ]

    it('renders every category label by default (last included)', () => {
      const { container } = render(<BarChart series={wide} x={x} y={y} title="Wide" />)
      const labels = [...container.querySelectorAll('svg text')].map((t) => t.textContent)
      expect(labels).toEqual(expect.arrayContaining(['Jan', 'Feb', 'Mar', 'Apr']))
    })

    it('thins labels with xLabelEvery, always keeping the last', () => {
      const { container } = render(
        <BarChart series={wide} x={x} y={y} title="Wide" xLabelEvery={2} />,
      )
      const labels = [...container.querySelectorAll('svg text')].map((t) => t.textContent)
      expect(labels).toContain('Jan') // index 0 kept
      expect(labels).not.toContain('Feb') // index 1 thinned
      expect(labels).toContain('Mar') // index 2 kept
      expect(labels).toContain('Apr') // last always kept
    })
  })

  describe('tiny embedded sizing (T4)', () => {
    it('renders crisply at plain 280×140 with no clipped/NaN marks', () => {
      const { container } = render(
        <BarChart
          series={series}
          x={x}
          y={y}
          title="Tiny"
          mode="stacked"
          plain
          width={280}
          height={140}
        />,
      )
      expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 280 140')
      const rects = [...container.querySelectorAll('rect[data-series]')]
      expect(rects.length).toBe(4)
      for (const r of rects) {
        const xv = Number(r.getAttribute('x'))
        const yv = Number(r.getAttribute('y'))
        const w = Number(r.getAttribute('width'))
        const h = Number(r.getAttribute('height'))
        for (const n of [xv, yv, w, h]) expect(Number.isFinite(n)).toBe(true)
        expect(xv).toBeGreaterThanOrEqual(0)
        expect(yv).toBeGreaterThanOrEqual(0)
        expect(xv + w).toBeLessThanOrEqual(280 + 0.5)
        expect(yv + h).toBeLessThanOrEqual(140 + 0.5)
      }
    })
  })

  describe('toStackedSeries integration (T4)', () => {
    it('renders a stacked chart from row-oriented data, preserving color', () => {
      const rows = [
        {
          label: 'Mon',
          segments: [
            { key: 'Done', value: 5, color: 'rebeccapurple' },
            { key: 'Blocked', value: 2 },
          ],
        },
        { label: 'Tue', segments: [{ key: 'Done', value: 8, color: 'rebeccapurple' }] },
      ]
      const { container } = render(
        <BarChart mode="stacked" {...toStackedSeries(rows)} title="From rows" />,
      )
      // 2 keys × 2 categories = 4 rects (missing "Blocked" on Tue is a 0-height rect).
      expect(container.querySelectorAll('rect[data-series]').length).toBe(4)
      const doneRects = [...container.querySelectorAll('rect[data-series="Done"]')]
      expect(doneRects.every((r) => r.getAttribute('fill') === 'rebeccapurple')).toBe(true)
    })
  })

  describe('plain mode', () => {
    it('renders no Axis or GridLines elements', () => {
      const { container } = render(<BarChart series={series} x={x} y={y} title="Plain" plain />)
      expect(container.querySelectorAll('g[aria-hidden="true"]')).toHaveLength(0)
    })

    it('renders no legend', () => {
      const { container } = render(<BarChart series={series} x={x} y={y} title="Plain" plain />)
      expect(container.querySelectorAll('button[aria-pressed]')).toHaveLength(0)
    })

    it('respects explicit width/height in plain mode', () => {
      const { container } = render(
        <BarChart series={series} x={x} y={y} title="Plain" plain width={120} height={32} />,
      )
      const svg = container.querySelector('svg')
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 32')
    })
  })
})
