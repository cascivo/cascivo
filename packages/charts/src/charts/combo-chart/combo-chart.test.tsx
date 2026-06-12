import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComboChart } from './combo-chart'

const bars = [
  { label: 'Jan', value: 100 },
  { label: 'Feb', value: 120 },
  { label: 'Mar', value: 90 },
]
const line = [
  { x: 0, y: 50 },
  { x: 1, y: 70 },
  { x: 2, y: 60 },
]

describe('ComboChart', () => {
  it('renders fallback table', () => {
    render(<ComboChart bars={bars} line={line} title="Combo test" />)
    expect(screen.getByRole('table')).toBeDefined()
    expect(screen.getByText('Combo test')).toBeDefined()
  })

  it('shows bar labels in table', () => {
    render(<ComboChart bars={bars} line={line} title="Bars" />)
    expect(screen.getAllByText('Jan').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Feb').length).toBeGreaterThan(0)
  })

  it('handles empty bars', () => {
    render(<ComboChart bars={[]} line={line} title="Empty" />)
    expect(screen.getByRole('table')).toBeDefined()
  })

  describe('plain mode', () => {
    it('renders no Axis or GridLines elements', () => {
      const { container } = render(<ComboChart bars={bars} line={line} title="Plain" plain />)
      expect(container.querySelectorAll('g[aria-hidden="true"]')).toHaveLength(0)
    })

    it('respects explicit width/height in plain mode', () => {
      const { container } = render(
        <ComboChart bars={bars} line={line} title="Plain" plain width={120} height={32} />,
      )
      const svg = container.querySelector('svg')
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 32')
    })
  })
})
