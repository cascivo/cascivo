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
