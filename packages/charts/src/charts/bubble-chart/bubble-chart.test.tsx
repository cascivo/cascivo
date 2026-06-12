import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BubbleChart } from './bubble-chart'

const series = [
  {
    name: 'Group A',
    data: [
      { x: 1, y: 2, size: 10 },
      { x: 3, y: 4, size: 30 },
    ],
  },
  { name: 'Group B', data: [{ x: 5, y: 6, size: 20 }] },
]

describe('BubbleChart', () => {
  it('renders fallback table', () => {
    render(<BubbleChart series={series} title="Bubble test" />)
    expect(screen.getByRole('table')).toBeDefined()
    expect(screen.getByText('Bubble test')).toBeDefined()
  })

  it('shows series, x, y, size columns', () => {
    render(<BubbleChart series={series} title="Cols" />)
    expect(screen.getByText('Series')).toBeDefined()
    expect(screen.getByText('X')).toBeDefined()
    expect(screen.getByText('Y')).toBeDefined()
    expect(screen.getByText('Size')).toBeDefined()
  })

  it('handles empty series', () => {
    render(<BubbleChart series={[]} title="Empty" />)
    expect(screen.getByRole('table')).toBeDefined()
  })

  describe('plain mode', () => {
    it('renders no Axis or GridLines elements', () => {
      const { container } = render(<BubbleChart series={series} title="Plain" plain />)
      expect(container.querySelectorAll('g[aria-hidden="true"]')).toHaveLength(0)
    })

    it('respects explicit width/height in plain mode', () => {
      const { container } = render(
        <BubbleChart series={series} title="Plain" plain width={120} height={32} />,
      )
      const svg = container.querySelector('svg')
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 32')
    })
  })
})
