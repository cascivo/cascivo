import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Boxplot } from './boxplot'

const series = [
  { id: 'a', label: 'Group A', values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { id: 'b', label: 'Group B', values: [5, 6, 7, 8, 9] },
]

describe('Boxplot', () => {
  it('renders fallback table', () => {
    render(<Boxplot series={series} title="Box test" />)
    expect(screen.getByRole('table')).toBeDefined()
    expect(screen.getByText('Box test')).toBeDefined()
  })

  it('shows five-number summary headers', () => {
    render(<Boxplot series={series} title="Stats" />)
    expect(screen.getByText('Median')).toBeDefined()
    expect(screen.getByText('Q1')).toBeDefined()
    expect(screen.getByText('Q3')).toBeDefined()
  })

  it('renders a row per series', () => {
    const { container } = render(<Boxplot series={series} title="Rows" />)
    const rows = container.querySelectorAll('tbody tr')
    expect(rows.length).toBe(2)
  })

  it('handles empty series array', () => {
    render(<Boxplot series={[]} title="Empty" />)
    expect(screen.getByRole('table')).toBeDefined()
  })

  describe('plain mode', () => {
    it('renders no Axis elements', () => {
      const { container } = render(<Boxplot series={series} title="Plain" plain />)
      expect(container.querySelectorAll('g[aria-hidden="true"]')).toHaveLength(0)
    })

    it('respects explicit width/height in plain mode', () => {
      const { container } = render(
        <Boxplot series={series} title="Plain" plain width={120} height={32} />,
      )
      const svg = container.querySelector('svg')
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 32')
    })
  })
})
