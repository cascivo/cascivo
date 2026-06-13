import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Heatmap } from './heatmap'

const data = [
  { x: 'Mon', y: 'AM', value: 10 },
  { x: 'Mon', y: 'PM', value: 20 },
  { x: 'Tue', y: 'AM', value: 15 },
  { x: 'Tue', y: 'PM', value: 5 },
]

describe('Heatmap', () => {
  it('renders fallback table', () => {
    render(<Heatmap data={data} title="Heatmap test" />)
    expect(screen.getByRole('table')).toBeDefined()
    expect(screen.getByText('Heatmap test')).toBeDefined()
  })

  it('shows X, Y, Value headers', () => {
    render(<Heatmap data={data} title="Headers" />)
    expect(screen.getByText('X')).toBeDefined()
    expect(screen.getByText('Y')).toBeDefined()
    expect(screen.getByText('Value')).toBeDefined()
  })

  it('handles empty data', () => {
    render(<Heatmap data={[]} title="Empty" />)
    expect(screen.getByRole('table')).toBeDefined()
  })

  it('renders aria-live region for tooltip', () => {
    render(<Heatmap data={data} title="Heatmap" />)
    expect(document.querySelector('[aria-live="polite"]')).toBeTruthy()
  })

  it('has no ad-hoc tooltip signal text element in plain mode', () => {
    const { container } = render(<Heatmap data={data} title="Heatmap" plain />)
    // Old implementation rendered a tooltip <text> element; plain mode has no axes so no text at all
    const textEls = container.querySelectorAll('text')
    expect(textEls.length).toBe(0)
  })

  describe('plain mode', () => {
    it('renders no Axis elements', () => {
      const { container } = render(<Heatmap data={data} title="Plain" plain />)
      expect(container.querySelectorAll('g[aria-hidden="true"]')).toHaveLength(0)
    })

    it('respects explicit width/height in plain mode', () => {
      const { container } = render(
        <Heatmap data={data} title="Plain" plain width={120} height={32} />,
      )
      const svg = container.querySelector('svg')
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 32')
    })
  })
})
