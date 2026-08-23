import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CalendarHeatmap } from './calendar'

const data = Array.from({ length: 30 }, (_, i) => ({
  day: `2026-01-${String(i + 1).padStart(2, '0')}`,
  value: (i * 3) % 11,
}))

describe('CalendarHeatmap', () => {
  it('renders with an accessible title', () => {
    render(<CalendarHeatmap data={data} title="Activity" width={400} height={160} />)
    expect(screen.getByRole('img', { name: 'Activity' })).toBeTruthy()
  })
  it('renders a cell per day in range', () => {
    const { container } = render(
      <CalendarHeatmap data={data} title="Activity" width={400} height={160} />,
    )
    expect(container.querySelectorAll('rect[data-day]').length).toBeGreaterThanOrEqual(30)
  })
  it('shows an empty placeholder with no data', () => {
    const { container } = render(<CalendarHeatmap data={[]} title="E" width={400} height={160} />)
    expect(container.querySelector('[data-empty]')).toBeTruthy()
  })
})

/**
 * The grid must never be cropped by its own viewBox.
 *
 * 119 days in a 1054px card emitted `viewBox="0 0 1054 160"` while laying out seven rows of
 * 59px cells — 434px of content in a 160px box, with rows 3-7 silently cut off. The output
 * reads as "this heatmap has three rows of data", which is plausible enough to ship
 * (2026-08-22 report item 11).
 */
describe('CalendarHeatmap does not clip its grid', () => {
  const range = Array.from({ length: 119 }, (_, i) => ({
    day: new Date(Date.UTC(2026, 0, 1) + i * 86_400_000),
    value: i % 7,
  }))

  it('keeps every drawn row inside the viewBox at the reported size', () => {
    const { container } = render(
      <CalendarHeatmap data={range} title="Activity" width={1054} height={160} />,
    )
    const rects = [...container.querySelectorAll('rect[data-day]')]
    expect(rects.length).toBeGreaterThan(0)
    const deepest = Math.max(
      ...rects.map((r) => Number(r.getAttribute('y')) + Number(r.getAttribute('height'))),
    )
    expect(deepest).toBeLessThanOrEqual(160)
  })

  it('renders all seven weekday rows, not just the ones that fit', () => {
    const { container } = render(
      <CalendarHeatmap data={range} title="Activity" width={1054} height={160} />,
    )
    const ys = new Set(
      [...container.querySelectorAll('rect[data-day]')].map((r) => r.getAttribute('y')),
    )
    expect(ys.size).toBe(7)
  })

  it('leaves a year-length range at the size it already rendered', () => {
    // The clamp must fix only what was broken: a full year at 1054px produces ~17.9px cells,
    // which fit, so a fixed max-cell default would have regressed exactly this case.
    const year = Array.from({ length: 365 }, (_, i) => ({
      day: new Date(Date.UTC(2026, 0, 1) + i * 86_400_000),
      value: i % 5,
    }))
    const { container } = render(
      <CalendarHeatmap data={year} title="Year" width={1054} height={160} />,
    )
    const first = container.querySelector('rect[data-day]')!
    expect(Number(first.getAttribute('width'))).toBeCloseTo(16.92, 1)
  })

  it('shrinks cells rather than cropping rows when height is small', () => {
    const { container } = render(
      <CalendarHeatmap data={range} title="Activity" width={1054} height={80} />,
    )
    const rects = [...container.querySelectorAll('rect[data-day]')]
    const deepest = Math.max(
      ...rects.map((r) => Number(r.getAttribute('y')) + Number(r.getAttribute('height'))),
    )
    expect(deepest).toBeLessThanOrEqual(80)
  })
})
