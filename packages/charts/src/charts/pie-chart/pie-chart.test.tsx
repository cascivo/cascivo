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

  it('renders aria-live region for tooltip', () => {
    render(<PieChart data={data} title="Pie" />)
    expect(document.querySelector('[aria-live="polite"]')).toBeTruthy()
  })

  describe('plain mode', () => {
    it('renders no legend', () => {
      const { container } = render(<PieChart data={data} title="Plain" plain />)
      expect(container.querySelectorAll('button[aria-pressed]')).toHaveLength(0)
    })

    it('keeps role=img and fallback table in plain mode', () => {
      const { container } = render(<PieChart data={data} title="Plain" plain />)
      expect(container.querySelector('svg[role="img"]')).toBeTruthy()
      expect(container.querySelector('table')).toBeTruthy()
    })

    it('respects explicit width/height in plain mode', () => {
      const { container } = render(
        <PieChart data={data} title="Plain" plain width={120} height={32} />,
      )
      const svg = container.querySelector('svg')
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 32')
    })
  })
})
