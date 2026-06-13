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

  it('renders aria-live region when tooltip is enabled', () => {
    render(<AreaChart series={series} x={x} y={y} title="Area" tooltip />)
    expect(document.querySelector('[aria-live="polite"]')).toBeTruthy()
  })

  it('renders focusable layer when tooltip is enabled', () => {
    render(<AreaChart series={series} x={x} y={y} title="Area" tooltip />)
    expect(screen.getByRole('application')).toBeTruthy()
  })

  describe('plain mode', () => {
    it('renders no Axis or GridLines elements', () => {
      const { container } = render(<AreaChart series={series} x={x} y={y} title="Plain" plain />)
      expect(container.querySelectorAll('g[aria-hidden="true"]')).toHaveLength(0)
    })

    it('renders no legend', () => {
      const { container } = render(<AreaChart series={series} x={x} y={y} title="Plain" plain />)
      expect(container.querySelectorAll('button[aria-pressed]')).toHaveLength(0)
    })

    it('respects explicit width/height in plain mode', () => {
      const { container } = render(
        <AreaChart series={series} x={x} y={y} title="Plain" plain width={120} height={32} />,
      )
      const svg = container.querySelector('svg')
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 32')
    })
  })
})
