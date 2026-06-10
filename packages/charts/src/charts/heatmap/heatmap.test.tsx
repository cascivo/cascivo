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
})
