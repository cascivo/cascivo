import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Radar } from './radar'

const axes = ['Speed', 'Power', 'Range', 'Efficiency', 'Cost']
const series = [
  { id: 'a', label: 'Model A', values: [80, 70, 60, 90, 50] },
  { id: 'b', label: 'Model B', values: [60, 85, 75, 70, 80] },
]

describe('Radar', () => {
  it('renders fallback table', () => {
    render(<Radar axes={axes} series={series} title="Radar test" />)
    expect(screen.getByRole('table')).toBeDefined()
    expect(screen.getByText('Radar test')).toBeDefined()
  })

  it('shows axes as column headers', () => {
    render(<Radar axes={axes} series={series} title="Headers" />)
    expect(screen.getAllByText('Speed').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Power').length).toBeGreaterThan(0)
  })

  it('shows series labels', () => {
    render(<Radar axes={axes} series={series} title="Series" />)
    expect(screen.getByText('Model A')).toBeDefined()
    expect(screen.getByText('Model B')).toBeDefined()
  })

  it('handles empty series', () => {
    render(<Radar axes={axes} series={[]} title="Empty" />)
    expect(screen.getByRole('table')).toBeDefined()
  })

  it('renders aria-live region for tooltip', () => {
    render(<Radar axes={axes} series={series} title="Radar" />)
    expect(document.querySelector('[aria-live="polite"]')).toBeTruthy()
  })

  describe('plain mode', () => {
    it('renders no ring or spoke chrome', () => {
      const { container } = render(<Radar axes={axes} series={series} title="Plain" plain />)
      // In plain mode: no text labels for axes, no ring polygons with cascade border color
      const axisTexts = Array.from(container.querySelectorAll('text')).filter(
        (t) => t.getAttribute('fill') === 'var(--cascivo-text-secondary)',
      )
      expect(axisTexts).toHaveLength(0)
    })

    it('respects explicit width/height in plain mode', () => {
      const { container } = render(
        <Radar axes={axes} series={series} title="Plain" plain width={120} height={32} />,
      )
      const svg = container.querySelector('svg')
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 32')
    })
  })
})
