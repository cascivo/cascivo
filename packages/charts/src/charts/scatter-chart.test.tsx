import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScatterChart } from './scatter-chart'

const series = [
  {
    id: 'a',
    label: 'Group A',
    data: [
      { x: 1, y: 2 },
      { x: 3, y: 4 },
      { x: 5, y: 1 },
    ],
  },
  {
    id: 'b',
    label: 'Group B',
    data: [
      { x: 2, y: 3 },
      { x: 4, y: 5 },
    ],
  },
]

describe('ScatterChart', () => {
  it('renders without crash', () => {
    render(<ScatterChart series={series} title="Scatter" />)
    expect(screen.getByRole('img', { name: 'Scatter' })).toBeTruthy()
  })

  it('renders circles for each point', () => {
    const { container } = render(<ScatterChart series={series} title="Scatter" />)
    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBe(5) // 3 + 2
  })

  it('renders fallback table', () => {
    const { container } = render(<ScatterChart series={series} title="Scatter" />)
    expect(container.querySelector('table')).toBeTruthy()
  })

  it('shows legend for multiple series', () => {
    render(<ScatterChart series={series} title="Scatter" />)
    expect(screen.getAllByText('Group A').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Group B').length).toBeGreaterThan(0)
  })
})
