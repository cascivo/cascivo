/**
 * The shared axis-chrome contract.
 *
 * Every chart used to assemble its own margins and stride, and the divergence is exactly how
 * `ComboChart` shipped clipping its left labels (`60,000` → `),000`), smearing its category
 * labels into `Jun 27Jun 28Jun 29…`, and clipping its right axis — while `leftMarginForLabels`
 * and `autoLabelStride` had existed all along and three sibling charts already called them.
 *
 * These tests assert the *rendered output*, not that a helper was called, so a chart that
 * reimplements the chrome badly still fails.
 */
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AreaChart } from './area-chart/area-chart'
import { BarChart } from './bar-chart/bar-chart'
import { ComboChart } from './combo-chart/combo-chart'
import { LineChart } from './line-chart/line-chart'
import { __resetChartWarnings } from '../core/dev-warn'
import { autoLabelStride, leftMarginForLabels, rightMarginForLabels } from '../core/use-chart'

/** 30 days of dashboard-scale data — the shape both adopter reports used. */
const DAYS = Array.from({ length: 30 }, (_, i) => `Jun ${i + 1}`)
const BARS = DAYS.map((label, i) => ({ label, value: 40_000 + i * 800 }))
const LINE = DAYS.map((_, i) => ({ x: i, y: 80 + (i % 7) * 5 }))

/** The `<g>` a chart translates its plot into carries the resolved left/top margins. */
function plotOffset(container: HTMLElement): { left: number; top: number } {
  const g = container.querySelector('g[transform^="translate("]')
  const m = /translate\(([\d.]+),\s*([\d.]+)\)/.exec(g?.getAttribute('transform') ?? '')
  return { left: Number(m?.[1] ?? 0), top: Number(m?.[2] ?? 0) }
}

function textsOf(container: HTMLElement): string[] {
  return [...container.querySelectorAll('svg text')].map((t) => t.textContent ?? '')
}

beforeEach(() => {
  __resetChartWarnings()
})

describe('left margin fits the widest left-axis label', () => {
  it('ComboChart reserves room for a 6-glyph thousands label', () => {
    const { container } = render(
      <ComboChart title="Traffic" bars={BARS} line={LINE} width={900} height={320} />,
    )
    // "60,000" needs ~50px; the old bare DEFAULT_MARGINS.left of 36 clipped it.
    expect(plotOffset(container).left).toBeGreaterThanOrEqual(
      leftMarginForLabels(['60,000'], false),
    )
  })

  it('BarChart and AreaChart do the same', () => {
    const bar = render(
      <BarChart
        title="Traffic"
        series={[{ id: 'req', label: 'Requests', data: BARS }]}
        x={(d) => d.label}
        y={(d) => d.value}
        width={900}
        height={320}
      />,
    )
    expect(plotOffset(bar.container).left).toBeGreaterThanOrEqual(
      leftMarginForLabels(['60,000'], false),
    )

    const area = render(
      <AreaChart
        title="Traffic"
        series={[
          { id: 'req', label: 'Requests', data: BARS.map((b, i) => ({ x: i, y: b.value })) },
        ]}
        x={(d) => d.x}
        y={(d) => d.y}
        width={900}
        height={320}
      />,
    )
    expect(plotOffset(area.container).left).toBeGreaterThanOrEqual(
      leftMarginForLabels(['60,000'], false),
    )
  })
})

describe('crowded category axes are strided', () => {
  it('ComboChart thins 30 category labels instead of smearing them', () => {
    const { container } = render(
      <ComboChart title="Traffic" bars={BARS} line={LINE} width={600} height={320} />,
    )
    const rendered = textsOf(container).filter((t) => t.startsWith('Jun '))
    expect(rendered.length).toBeGreaterThan(0)
    expect(rendered.length).toBeLessThan(DAYS.length)
  })

  it('the auto stride never leaves the last two labels adjacent', () => {
    // 30 labels at stride 4 → …24, 28 and the always-drawn 29. Rendering both 28 and 29
    // produced "Jul 21 JulJ2526" at the right edge.
    const { container } = render(
      <ComboChart
        title="Traffic"
        bars={BARS}
        line={LINE}
        width={600}
        height={320}
        xLabelEvery={4}
      />,
    )
    const rendered = textsOf(container).filter((t) => t.startsWith('Jun '))
    expect(rendered).toContain('Jun 30') // the final label is always drawn
    expect(rendered).not.toContain('Jun 29') // …and its strided neighbour is dropped
  })

  it('autoLabelStride returns undefined when every label fits', () => {
    expect(autoLabelStride(['a', 'b', 'c'], 900)).toBeUndefined()
  })

  it('autoLabelStride measures stacked labels by line height, not text width', () => {
    // The reported case: 7 route names down a 240px-tall axis. Measured as horizontal
    // text they look crowded (one is 8 chars ≈ 58px vs a 34px band) and get strided away;
    // stacked, each has a whole 34px row for a ~14px line box, so all seven fit.
    const routes = ['/', '/pricing', '/docs', '/blog', '/about', '/careers', '/contact']
    expect(autoLabelStride(routes, 240, 'vertical')).toBeUndefined()
    expect(autoLabelStride(routes, 240, 'horizontal')).toBeGreaterThan(1)
  })

  it('autoLabelStride still thins a genuinely crowded vertical axis', () => {
    // Direction-awareness must not become "never stride" — 40 labels in 240px is 6px a row.
    const many = Array.from({ length: 40 }, (_, i) => `row ${i}`)
    expect(autoLabelStride(many, 240, 'vertical')).toBeGreaterThan(1)
  })

  it('a 7-category horizontal BarChart renders every category label', () => {
    const routes = ['/', '/pricing', '/docs', '/blog', '/about', '/careers', '/contact']
    const { container } = render(
      <BarChart
        title="Top routes"
        orientation="horizontal"
        series={[
          { id: 'views', label: 'Views', data: routes.map((r, i) => ({ r, v: (i + 1) * 100 })) },
        ]}
        x={(d) => d.r}
        y={(d) => d.v}
        width={600}
        height={260}
      />,
    )
    const rendered = textsOf(container)
    for (const route of routes) expect(rendered).toContain(route)
  })
})

describe('secondAxis.label names the right-hand scale', () => {
  const SERIES = [
    {
      id: 'req',
      label: 'Requests',
      data: [
        { t: 1, v: 100 },
        { t: 2, v: 200 },
      ],
    },
    {
      id: 'err',
      label: 'Errors',
      axis: 'right' as const,
      data: [
        { t: 1, v: 3 },
        { t: 2, v: 7 },
      ],
    },
  ]

  it('AreaChart renders the label (it was typed but never drawn)', () => {
    const { container } = render(
      <AreaChart
        title="Traffic"
        series={SERIES}
        x={(d) => d.t}
        y={(d) => d.v}
        secondAxis={{ label: 'Errors' }}
        width={720}
        height={320}
      />,
    )
    // Before the fix the SVG contained only tick values — no "Errors" text anywhere, so a
    // dual-axis chart could not say which series belonged to which scale.
    expect(textsOf(container)).toContain('Errors')
  })

  it('LineChart does the same', () => {
    const { container } = render(
      <LineChart
        title="Traffic"
        series={SERIES}
        x={(d) => d.t}
        y={(d) => d.v}
        secondAxis={{ label: 'Errors/min' }}
        width={720}
        height={320}
      />,
    )
    expect(textsOf(container)).toContain('Errors/min')
  })

  it('reserves margin so the rotated title is not clipped by the SVG edge', () => {
    const withTitle = rightMarginForLabels({
      rightAxisLabels: ['4,000'],
      rightAxisTitle: true,
    })
    const without = rightMarginForLabels({ rightAxisLabels: ['4,000'] })
    expect(withTitle).toBeGreaterThan(without)
  })
})

describe('right margin is reserved for right-hand chrome', () => {
  it('a right axis renders its labels outside the plot, not over it', () => {
    const { container } = render(
      <ComboChart title="Traffic" bars={BARS} line={LINE} secondAxis width={900} height={320} />,
    )
    // `orientation="y-right"` anchors labels at start, x > 0 — a `y` axis translated to the
    // right edge anchored them at end, x = -8, i.e. inside the plot on top of the marks.
    const rightAxisLabels = [...container.querySelectorAll('svg text')].filter(
      (t) => t.getAttribute('text-anchor') === 'start',
    )
    expect(rightAxisLabels.length).toBeGreaterThan(0)
    for (const label of rightAxisLabels) expect(Number(label.getAttribute('x'))).toBeGreaterThan(0)
  })

  it('rightMarginForLabels reserves half the final bottom label’s width', () => {
    // "7/26/2026" is 9 glyphs ≈ 58px, so ~31px must be reserved — the default was 8.
    expect(rightMarginForLabels({ bottomAxisLabels: ['1/1/2026', '7/26/2026'] })).toBeGreaterThan(
      25,
    )
    expect(rightMarginForLabels({ bottomAxisLabels: [] })).toBe(8)
    expect(rightMarginForLabels({ rightAxisLabels: ['120'], plain: true })).toBe(2)
  })

  it('a time-axis LineChart reserves room for its final date label', () => {
    const dates = Array.from({ length: 10 }, (_, i) => ({
      x: new Date(2026, 6, i + 17),
      y: i * 10,
    }))
    const { container } = render(
      <LineChart
        title="Traffic"
        series={[{ id: 'a', label: 'A', data: dates }]}
        x={(d) => d.x}
        y={(d) => d.y}
        width={600}
        height={300}
      />,
    )
    const svg = container.querySelector('svg')!
    const width = Number(svg.getAttribute('width') ?? 600)
    const plotWidth = [...container.querySelectorAll('line')]
      .map((l) => Number(l.getAttribute('x2') ?? 0))
      .reduce((m, v) => Math.max(m, v), 0)
    // The plot must stop short of the SVG edge by more than the old 8px default.
    expect(width - plotOffset(container).left - plotWidth).toBeGreaterThan(8)
  })
})

describe('the accessible fallback represents every series', () => {
  it('ComboChart’s table has a column for the line series', () => {
    const { container } = render(
      <ComboChart
        title="Traffic"
        bars={BARS}
        line={LINE}
        barsLabel="Requests"
        lineLabel="Bandwidth"
        width={900}
        height={320}
      />,
    )
    const headers = [...container.querySelectorAll('table th')].map((th) => th.textContent)
    expect(headers).toContain('Requests')
    expect(headers).toContain('Bandwidth')
    // …and the values are actually in the rows, not just the header.
    const firstRow = container.querySelector('table tbody tr')!
    expect(firstRow.querySelectorAll('td')).toHaveLength(3)
  })
})

describe('a two-metric chart names its metrics', () => {
  it('ComboChart shows a legend by default when it has both series', () => {
    const { getByRole } = render(
      <ComboChart
        title="Traffic"
        bars={BARS}
        line={LINE}
        barsLabel="Requests"
        lineLabel="Bandwidth"
        width={900}
        height={320}
      />,
    )
    expect(getByRole('button', { name: /Requests/ })).toBeTruthy()
    expect(getByRole('button', { name: /Bandwidth/ })).toBeTruthy()
  })

  it('legend can be turned off, and is off in plain mode', () => {
    const { queryByRole } = render(
      <ComboChart title="T" bars={BARS} line={LINE} legend={false} width={900} height={320} />,
    )
    expect(queryByRole('button', { name: /Bars/ })).toBeNull()
  })
})

describe('index-correlated series are checked', () => {
  it('ComboChart warns when line and bars have different lengths', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<ComboChart title="T" bars={BARS} line={LINE.slice(0, 5)} width={900} height={320} />)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('correlated by array index'))
    warn.mockRestore()
  })

  it('ComboChart warns when two metrics of very different magnitude share one axis', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<ComboChart title="T" bars={BARS} line={LINE} width={900} height={320} />)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('20×'))
    warn.mockRestore()
  })
})

describe('overlapping area fills stay distinguishable', () => {
  const two = [
    {
      id: 'a',
      label: 'Requests',
      data: [
        { x: 0, y: 50_000 },
        { x: 1, y: 52_000 },
      ],
    },
    {
      id: 'b',
      label: 'Errors',
      data: [
        { x: 0, y: 300 },
        { x: 1, y: 280 },
      ],
    },
  ]

  it('drops the fill opacity when more than one solid area shares the plot', () => {
    const one = render(
      <AreaChart title="T" series={[two[0]!]} x={(d) => d.x} y={(d) => d.y} width={600} />,
    )
    const both = render(
      <AreaChart title="T" series={two} x={(d) => d.x} y={(d) => d.y} width={600} />,
    )
    const opacityOf = (c: HTMLElement) =>
      [...c.querySelectorAll('path')]
        .map((p) => (p as SVGElement).style.fillOpacity)
        .find((v) => v !== '')
    expect(opacityOf(one.container)).toContain('--cascivo-chart-fill-opacity,')
    expect(opacityOf(both.container)).toContain('--cascivo-chart-fill-opacity-overlap')
  })

  it('stacked areas keep the full opacity — they never overlap', () => {
    const { container } = render(
      <AreaChart title="T" series={two} x={(d) => d.x} y={(d) => d.y} stacked width={600} />,
    )
    const opacity = [...container.querySelectorAll('path')]
      .map((p) => (p as SVGElement).style.fillOpacity)
      .find((v) => v !== '')
    expect(opacity).toContain('--cascivo-chart-fill-opacity,')
  })

  it('warns when a legend would name a series the plot cannot show', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<AreaChart title="T" series={two} x={(d) => d.x} y={(d) => d.y} width={600} />)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("axis: 'right'"))
    warn.mockRestore()
  })
})
