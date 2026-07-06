import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LineChart } from './line-chart'

const series = [
  {
    id: 'a',
    label: 'Series A',
    data: [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
      { x: 2, y: 15 },
    ],
  },
  {
    id: 'b',
    label: 'Series B',
    data: [
      { x: 0, y: 5 },
      { x: 1, y: 8 },
      { x: 2, y: 12 },
    ],
  },
]

const x = (d: { x: number; y: number }) => d.x
const y = (d: { x: number; y: number }) => d.y

describe('LineChart', () => {
  it('renders one path per series', () => {
    const { container } = render(<LineChart series={series} x={x} y={y} title="Test Chart" />)
    const paths = container.querySelectorAll('path[data-series]')
    expect(paths).toHaveLength(2)
    paths.forEach((path) => {
      expect(path.getAttribute('d')).toMatch(/^M/)
    })
  })

  it('has role="img" with title as aria-label', () => {
    render(<LineChart series={series} x={x} y={y} title="My Chart" />)
    expect(screen.getByRole('img', { name: 'My Chart' })).toBeTruthy()
  })

  it('shows legend with multiple series', () => {
    render(<LineChart series={series} x={x} y={y} title="Test" />)
    expect(screen.getAllByText('Series A').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Series B').length).toBeGreaterThan(0)
  })

  it('shows title text', () => {
    render(<LineChart series={series} x={x} y={y} title="My Chart Title" />)
    expect(screen.getByRole('img', { name: 'My Chart Title' })).toBeTruthy()
  })

  it('renders fallback table', () => {
    const { container } = render(<LineChart series={series} x={x} y={y} title="Test Chart" />)
    const table = container.querySelector('table')
    expect(table).toBeTruthy()
  })

  it('hides series path when legend toggle is clicked', async () => {
    const { container } = render(<LineChart series={series} x={x} y={y} title="Test Chart" />)
    const toggleA = screen.getByRole('button', { name: /Series A/i })
    fireEvent.click(toggleA)
    const pathA = container.querySelector('path[data-series="a"]')
    // After toggle, path is not rendered (hidden via signal → null return)
    expect(pathA).toBeNull()
  })

  it('renders with single series and no legend by default', () => {
    const single = [series[0]!]
    const { container } = render(<LineChart series={single} x={x} y={y} title="Single" />)
    // No legend buttons in DOM
    const buttons = container.querySelectorAll('button[aria-pressed]')
    expect(buttons).toHaveLength(0)
  })

  it('renders aria-live region when tooltip is enabled', () => {
    render(<LineChart series={series} x={x} y={y} title="Test Chart" tooltip />)
    expect(document.querySelector('[aria-live="polite"]')).toBeTruthy()
  })

  it('does not render aria-live region when tooltip is false', () => {
    render(<LineChart series={series} x={x} y={y} title="Test Chart" tooltip={false} />)
    expect(document.querySelector('[aria-live="polite"]')).toBeNull()
  })

  it('renders focusable layer when tooltip is enabled', () => {
    render(<LineChart series={series} x={x} y={y} title="Test Chart" tooltip />)
    expect(screen.getByRole('application')).toBeTruthy()
  })

  // Rendering 5000 points + a 5000-row fallback table in jsdom is heavy; under
  // loaded/cold CI it can exceed the 5s default, so give it explicit headroom.
  it('renders a large series without crashing', () => {
    const bigData = Array.from({ length: 5000 }, (_, i) => ({ x: i, y: Math.sin(i / 100) * 100 }))
    const bigSeries = [{ id: 'big', label: 'Big', data: bigData }]
    const { container } = render(<LineChart series={bigSeries} x={x} y={y} title="Big Chart" />)
    const path = container.querySelector('path[data-series="big"]')
    expect(path?.getAttribute('d')?.length).toBeGreaterThan(0)
  }, 20000)

  describe('plain mode', () => {
    it('renders no Axis or GridLines elements', () => {
      const { container } = render(<LineChart series={series} x={x} y={y} title="Plain" plain />)
      expect(container.querySelectorAll('g[aria-hidden="true"]')).toHaveLength(0)
    })

    it('renders no legend', () => {
      const { container } = render(<LineChart series={series} x={x} y={y} title="Plain" plain />)
      expect(container.querySelectorAll('button[aria-pressed]')).toHaveLength(0)
    })

    it('respects explicit width/height in plain mode', () => {
      const { container } = render(
        <LineChart series={series} x={x} y={y} title="Plain" plain width={120} height={32} />,
      )
      const svg = container.querySelector('svg')
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 32')
    })
  })
})
