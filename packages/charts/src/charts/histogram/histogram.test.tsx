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

  it('respects explicit bin count', () => {
    const { container } = render(
      <Histogram data={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} title="Binned" label="X" bins={5} />,
    )
    const rows = container.querySelectorAll('tbody tr')
    expect(rows.length).toBe(5)
  })
})
