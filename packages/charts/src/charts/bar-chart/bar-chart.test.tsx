import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BarChart } from './bar-chart'

const series = [
  {
    id: 'a',
    label: 'Q1',
    data: [
      { x: 'Jan', y: 10 },
      { x: 'Feb', y: 20 },
    ],
  },
  {
    id: 'b',
    label: 'Q2',
    data: [
      { x: 'Jan', y: 5 },
      { x: 'Feb', y: 15 },
    ],
  },
]
const x = (d: { x: string; y: number }) => d.x
const y = (d: { x: string; y: number }) => d.y

describe('BarChart', () => {
  it('renders without crash', () => {
    render(<BarChart series={series} x={x} y={y} title="Bar" />)
    expect(screen.getByRole('img', { name: 'Bar' })).toBeTruthy()
  })

  it('renders rects for each bar', () => {
    const { container } = render(<BarChart series={series} x={x} y={y} title="Bar" />)
    const rects = container.querySelectorAll('rect[data-series]')
    // 2 series × 2 categories = 4 bars
    expect(rects.length).toBe(4)
  })

  it('renders horizontal orientation', () => {
    const { container } = render(
      <BarChart series={series} x={x} y={y} title="Bar" orientation="horizontal" />,
    )
    expect(container.querySelectorAll('rect[data-series]').length).toBe(4)
  })

  it('renders stacked mode', () => {
    const { container } = render(
      <BarChart series={series} x={x} y={y} title="Stacked" mode="stacked" />,
    )
    expect(container.querySelectorAll('rect[data-series]').length).toBe(4)
  })

  it('renders fallback table', () => {
    const { container } = render(<BarChart series={series} x={x} y={y} title="Bar" />)
    expect(container.querySelector('table')).toBeTruthy()
  })

  describe('plain mode', () => {
    it('renders no Axis or GridLines elements', () => {
      const { container } = render(<BarChart series={series} x={x} y={y} title="Plain" plain />)
      expect(container.querySelectorAll('g[aria-hidden="true"]')).toHaveLength(0)
    })

    it('renders no legend', () => {
      const { container } = render(<BarChart series={series} x={x} y={y} title="Plain" plain />)
      expect(container.querySelectorAll('button[aria-pressed]')).toHaveLength(0)
    })

    it('respects explicit width/height in plain mode', () => {
      const { container } = render(
        <BarChart series={series} x={x} y={y} title="Plain" plain width={120} height={32} />,
      )
      const svg = container.querySelector('svg')
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 32')
    })
  })
})
