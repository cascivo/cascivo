import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
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
})
