import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Histogram } from './histogram'

describe('Histogram', () => {
  it('renders fallback table', () => {
    render(<Histogram data={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} title="Test" label="Value" />)
    expect(screen.getByRole('table')).toBeDefined()
    expect(screen.getByText('Test')).toBeDefined()
  })

  it('shows Range and Count headers', () => {
    render(<Histogram data={[1, 2, 3, 4, 5]} title="Dist" label="X" />)
    expect(screen.getByText('Range')).toBeDefined()
    expect(screen.getByText('Count')).toBeDefined()
  })

  it('handles empty data', () => {
    render(<Histogram data={[]} title="Empty" label="X" />)
    expect(screen.getByRole('table')).toBeDefined()
  })

  it('renders aria-live region for tooltip', () => {
    render(<Histogram data={[1, 2, 3, 4, 5]} title="Hist" label="X" />)
    expect(document.querySelector('[aria-live="polite"]')).toBeTruthy()
  })

  it('has no ad-hoc SVG text tooltip element in plain mode', () => {
    const { container } = render(<Histogram data={[1, 2, 3, 4, 5]} title="Hist" label="X" plain />)
    // Old implementation rendered a tooltip <text> element; plain mode has no axes so no text at all
    const textEls = container.querySelectorAll('text')
    expect(textEls.length).toBe(0)
  })

  it('respects explicit bin count', () => {
    const { container } = render(
      <Histogram data={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} title="Binned" label="X" bins={5} />,
    )
    const rows = container.querySelectorAll('tbody tr')
    expect(rows.length).toBe(5)
  })

  describe('plain mode', () => {
    it('renders no Axis or GridLines elements', () => {
      const { container } = render(
        <Histogram data={[1, 2, 3, 4, 5]} title="Plain" label="X" plain />,
      )
      expect(container.querySelectorAll('g[aria-hidden="true"]')).toHaveLength(0)
    })

    it('respects explicit width/height in plain mode', () => {
      const { container } = render(
        <Histogram data={[1, 2, 3, 4, 5]} title="Plain" label="X" plain width={120} height={32} />,
      )
      const svg = container.querySelector('svg')
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 32')
    })
  })
})
