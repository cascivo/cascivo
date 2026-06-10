import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AreaChart } from './area-chart'

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
})
