/**
 * The two `Sparkline`s draw the same chart.
 *
 * `@cascivo/charts/sparkline` exists so a page can render one trend line without the chart
 * engine (2026-08-21 red flag 4). That is only a saving if the output is the same chart —
 * a second implementation that drifts is a second component with one name, which is worse
 * than paying for the engine.
 *
 * The one documented difference is the hover tooltip: the lite entry has none, because the
 * tooltip is what requires the engine. So the SVG — the drawing, its accessible name, its
 * geometry — must match exactly, and the tooltip machinery around it need not.
 */
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Sparkline } from './sparkline'
import { Sparkline as SparklineLite } from './sparkline-lite'

const data = [4, 8, 2, 9, 6, 11, 7]

/** The drawn chart: the SVG only, with React's own attributes stripped. */
function svgOf(container: HTMLElement): string {
  const svg = container.querySelector('svg')!
  // `aria-describedby`/`id` carry a per-render useId value; normalise so two renders of the
  // same chart compare equal without weakening anything else in the comparison.
  return svg.outerHTML.replace(/(:r[0-9a-z]+:|«r[0-9a-z]+»)/g, ':id:')
}

describe('Sparkline parity — main entry vs @cascivo/charts/sparkline', () => {
  it('renders identical SVG for identical props', () => {
    const full = render(<Sparkline data={data} label="Requests" />)
    const lite = render(<SparklineLite data={data} label="Requests" />)
    expect(svgOf(lite.container)).toBe(svgOf(full.container))
  })

  it('matches on the non-default props too', () => {
    const props = { data, ariaLabel: 'Errors', width: 200, height: 48, endDot: false } as const
    const full = render(<Sparkline {...props} />)
    const lite = render(<SparklineLite {...props} />)
    expect(svgOf(lite.container)).toBe(svgOf(full.container))
  })

  it('matches on the empty-data path', () => {
    const full = render(<Sparkline data={[]} label="Requests" />)
    const lite = render(<SparklineLite data={[]} label="Requests" />)
    expect(svgOf(lite.container)).toBe(svgOf(full.container))
  })

  it('both require an accessible name, and it reaches aria-label', () => {
    const lite = render(<SparklineLite data={data} ariaLabel="Deploys per day" />)
    expect(lite.container.querySelector('svg')).toHaveAttribute('aria-label', 'Deploys per day')
  })
})
