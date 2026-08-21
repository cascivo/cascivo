import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AreaChart } from './area-chart'
import { __resetChartWarnings } from '../../core/dev-warn'

const series = [
  {
    id: 'a',
    label: 'Revenue',
    data: [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
      { x: 2, y: 15 },
    ],
  },
  {
    id: 'b',
    label: 'Cost',
    data: [
      { x: 0, y: 5 },
      { x: 1, y: 8 },
      { x: 2, y: 12 },
    ],
  },
]
const x = (d: { x: number; y: number }) => d.x
const y = (d: { x: number; y: number }) => d.y

describe('AreaChart', () => {
  it('renders without crash', () => {
    render(<AreaChart series={series} x={x} y={y} title="Area" />)
    expect(screen.getByRole('img', { name: 'Area' })).toBeTruthy()
  })

  it('honors a per-series y accessor over the chart-level y', () => {
    // Two series over ONE shared data row, plotting different fields.
    type Row = { t: number; requests: number; errors: number }
    const rows: Row[] = [
      { t: 0, requests: 100, errors: 5 },
      { t: 1, requests: 120, errors: 9 },
    ]
    const { container } = render(
      <AreaChart
        title="Multi-field"
        series={[
          { id: 'req', label: 'Requests', data: rows, y: (d) => d.requests },
          { id: 'err', label: 'Errors', data: rows, y: (d) => d.errors },
        ]}
        x={(d: Row) => d.t}
        y={(d: Row) => d.requests}
      />,
    )
    // The accessible fallback table renders each series' own accessor.
    const cells = [...container.querySelectorAll('tbody tr:first-child td')].map(
      (c) => c.textContent,
    )
    // [x, requests, errors] for the first row — errors used its own accessor (5, not 100).
    expect(cells).toEqual(['0', '100', '5'])
  })

  it('renders series groups', () => {
    const { container } = render(<AreaChart series={series} x={x} y={y} title="Area" />)
    const groups = container.querySelectorAll('g[data-series]')
    expect(groups).toHaveLength(2)
  })

  it('renders stacked variant', () => {
    const { container } = render(<AreaChart series={series} x={x} y={y} title="Stacked" stacked />)
    const groups = container.querySelectorAll('g[data-series]')
    expect(groups).toHaveLength(2)
  })

  it('renders fallback table', () => {
    const { container } = render(<AreaChart series={series} x={x} y={y} title="Area" />)
    expect(container.querySelector('table')).toBeTruthy()
  })

  it('renders aria-live region when tooltip is enabled', () => {
    render(<AreaChart series={series} x={x} y={y} title="Area" tooltip />)
    expect(document.querySelector('[aria-live="polite"]')).toBeTruthy()
  })

  it('renders focusable layer when tooltip is enabled', () => {
    render(<AreaChart series={series} x={x} y={y} title="Area" tooltip />)
    expect(screen.getByRole('application')).toBeTruthy()
  })

  describe('time axis (Date x)', () => {
    const dated = [
      {
        id: 's',
        label: 'Signups',
        data: [
          { day: new Date('2026-07-10T00:00:00Z'), y: 120 },
          { day: new Date('2026-07-20T00:00:00Z'), y: 180 },
          { day: new Date('2026-07-30T00:00:00Z'), y: 150 },
        ],
      },
    ]
    const dx = (d: { day: Date; y: number }) => d.day
    const dy = (d: { day: Date; y: number }) => d.y

    it('renders a Date x-axis with locale-formatted tick text', () => {
      const { container } = render(<AreaChart series={dated} x={dx} y={dy} title="Signups" />)
      const text = container.textContent ?? ''
      // A time scale formats ticks via toLocaleDateString(); at least one tick label
      // is a formatted date, not a raw epoch-ms number.
      const expected = new Date('2026-07-20T00:00:00Z').toLocaleDateString()
      const anyDateLabel = [...container.querySelectorAll('text')].some((t) =>
        /\d{1,4}[/.-]\d{1,2}/.test(t.textContent ?? ''),
      )
      expect(anyDateLabel || text.includes(expected)).toBe(true)
      // And no giant epoch-ms integer leaked into a tick.
      expect(text).not.toMatch(/17\d{11}/)
    })

    it('renders numeric x unchanged (regression)', () => {
      const { container } = render(<AreaChart series={series} x={x} y={y} title="Numeric" />)
      expect(container.querySelector('svg')).toBeTruthy()
    })
  })

  describe('plain mode', () => {
    it('renders no Axis or GridLines elements', () => {
      const { container } = render(<AreaChart series={series} x={x} y={y} title="Plain" plain />)
      expect(container.querySelectorAll('g[aria-hidden="true"]')).toHaveLength(0)
    })

    it('renders no legend', () => {
      const { container } = render(<AreaChart series={series} x={x} y={y} title="Plain" plain />)
      expect(container.querySelectorAll('button[aria-pressed]')).toHaveLength(0)
    })

    it('respects explicit width/height in plain mode', () => {
      const { container } = render(
        <AreaChart series={series} x={x} y={y} title="Plain" plain width={120} height={32} />,
      )
      const svg = container.querySelector('svg')
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 32')
    })
  })
})

/*
 * Per-series mark type (2026-08-08 report A).
 *
 * A dual-axis "requests vs errors" chart rendered two opaque fills, the smaller hidden
 * behind the larger. `fill` is chart-level so it could not make just one translucent, and
 * ComboChart is bar+line rather than area+line, so the shape was simply not expressible.
 */
describe('AreaChart per-series type', () => {
  const data = [
    { x: 0, y: 10 },
    { x: 1, y: 20 },
    { x: 2, y: 15 },
  ]

  function paths(container: HTMLElement, seriesId: string): SVGPathElement[] {
    const g = container.querySelector(`[data-series="${seriesId}"]`)!
    return [...g.querySelectorAll('path')]
  }

  it("a series with type='line' paints a stroke and no fill", () => {
    const { container } = render(
      <AreaChart
        title="Requests vs errors"
        series={[
          { id: 'requests', label: 'Requests', data },
          { id: 'errors', label: 'Errors', data, type: 'line' },
        ]}
        x={(d: { x: number }) => d.x}
        y={(d: { y: number }) => d.y}
      />,
    )
    const errorPaths = paths(container, 'errors')
    expect(errorPaths).toHaveLength(1)
    expect(errorPaths[0]!.getAttribute('fill')).toBe('none')

    // The default series is unchanged: a fill plus its stroke.
    expect(paths(container, 'requests').length).toBeGreaterThan(1)
  })

  it('the remaining area keeps full opacity when nothing overlaps it', () => {
    const { container } = render(
      <AreaChart
        title="Requests vs errors"
        series={[
          { id: 'requests', label: 'Requests', data },
          { id: 'errors', label: 'Errors', data, type: 'line' },
        ]}
        x={(d: { x: number }) => d.x}
        y={(d: { y: number }) => d.y}
      />,
    )
    const areaFill = paths(container, 'requests')[0]!
    expect(areaFill.getAttribute('style') ?? '').toContain('--cascivo-chart-fill-opacity')
    expect(areaFill.getAttribute('style') ?? '').not.toContain('overlap')
  })
})

/**
 * The two area-fill defects from the 2026-08-21 report.
 *
 * Item 7: `warnScaleMismatch` correctly steers a mismatched pair onto two axes, and then
 * two area fills composite into a muddy third colour where they cross — a problem the
 * existing warning solves halfway and stops.
 *
 * Item 8: a lone area renders as a solid block from the curve to the baseline, heavier than
 * the rest of the system. `fill: 'gradient'` already existed; only the default was wrong.
 */
describe('area fill defaults and the dual-axis warning', () => {
  const data = [
    { x: 0, y: 10 },
    { x: 1, y: 20 },
  ]
  const xy = { x: (d: { x: number }) => d.x, y: (d: { y: number }) => d.y }

  function twoAxisSeries(secondaryType?: 'line') {
    return [
      { id: 'requests', label: 'Requests', data },
      {
        id: 'errors',
        label: 'Errors',
        data,
        axis: 'right' as const,
        ...(secondaryType ? { type: secondaryType } : {}),
      },
    ]
  }

  it('warns when two series on separate axes both paint a fill', () => {
    __resetChartWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <AreaChart
        title="Requests vs errors"
        series={twoAxisSeries()}
        secondAxis={{ label: 'Errors' }}
        {...xy}
      />,
    )
    const message = warn.mock.calls.flat().join(' ')
    expect(message).toContain('composite to a third colour')
    // The fix has to be actionable: name the series to change and the prop that does it.
    expect(message).toContain('Errors')
    expect(message).toContain("type: 'line'")
    warn.mockRestore()
  })

  it('stays quiet once the secondary series is a line', () => {
    __resetChartWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <AreaChart
        title="Requests vs errors"
        series={twoAxisSeries('line')}
        secondAxis={{ label: 'Errors' }}
        {...xy}
      />,
    )
    expect(warn.mock.calls.flat().join(' ')).not.toContain('composite to a third colour')
    warn.mockRestore()
  })

  it('a single non-stacked series defaults to a gradient fill', () => {
    const { container } = render(
      <AreaChart title="Requests" series={[{ id: 'requests', label: 'Requests', data }]} {...xy} />,
    )
    expect(container.querySelector('linearGradient')).not.toBeNull()
  })

  it('two overlapping series keep the solid fill, so the bands stay readable', () => {
    const { container } = render(
      <AreaChart
        title="Two"
        series={[
          { id: 'a', label: 'A', data },
          { id: 'b', label: 'B', data },
        ]}
        {...xy}
      />,
    )
    expect(container.querySelector('linearGradient')).toBeNull()
  })

  it('an explicit `fill` still wins over the single-series default', () => {
    const { container } = render(
      <AreaChart
        title="Requests"
        fill="solid"
        series={[{ id: 'requests', label: 'Requests', data }]}
        {...xy}
      />,
    )
    expect(container.querySelector('linearGradient')).toBeNull()
  })
})
