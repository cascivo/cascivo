import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AreaChart } from './area-chart/area-chart'
import { LineChart } from './line-chart/line-chart'

const left = {
  id: 'bandwidth',
  label: 'Bandwidth',
  data: [
    { x: 0, y: 10 },
    { x: 1, y: 20 },
    { x: 2, y: 15 },
  ],
}
const right = {
  id: 'rps',
  label: 'Requests/sec',
  axis: 'right' as const,
  data: [
    { x: 0, y: 800 },
    { x: 1, y: 1200 },
    { x: 2, y: 950 },
  ],
}
const x = (d: { x: number }) => d.x
const y = (d: { y: number }) => d.y

describe('multi-axis', () => {
  it('LineChart renders a right axis whose ticks use secondAxis.format', () => {
    const { container } = render(
      <LineChart
        title="Usage"
        series={[left, right]}
        x={x}
        y={y}
        width={600}
        height={300}
        secondAxis={{ format: (n) => `R${n}` }}
      />,
    )
    expect(container.textContent).toContain('R')
  })

  it('AreaChart renders a right axis for an opted-in series', () => {
    const { container } = render(
      <AreaChart
        title="Usage"
        series={[left, right]}
        x={x}
        y={y}
        width={600}
        height={300}
        secondAxis={{ format: (n) => `RPS${n}` }}
      />,
    )
    expect(container.textContent).toContain('RPS')
  })

  it('a single-axis chart is unaffected (no right-axis format label)', () => {
    const { container } = render(
      <LineChart title="Usage" series={[left]} x={x} y={y} width={600} height={300} />,
    )
    expect(container.textContent).not.toContain('RPS')
  })
})
