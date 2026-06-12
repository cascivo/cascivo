import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Treemap } from './treemap'

const data = [
  { id: 'a', label: 'Alpha', value: 40 },
  { id: 'b', label: 'Beta', value: 25 },
  { id: 'c', label: 'Gamma', value: 20 },
  { id: 'd', label: 'Delta', value: 15 },
]

describe('Treemap', () => {
  it('renders fallback table', () => {
    render(<Treemap data={data} title="Treemap test" />)
    expect(screen.getByRole('table')).toBeDefined()
    expect(screen.getByText('Treemap test')).toBeDefined()
  })

  it('shows Label and Value headers', () => {
    render(<Treemap data={data} title="Headers" />)
    expect(screen.getByText('Label')).toBeDefined()
    expect(screen.getByText('Value')).toBeDefined()
  })

  it('handles empty data', () => {
    render(<Treemap data={[]} title="Empty" />)
    expect(screen.getByRole('table')).toBeDefined()
  })

  describe('plain mode', () => {
    it('renders no text labels', () => {
      const { container } = render(
        <Treemap data={data} title="Plain" plain width={400} height={300} />,
      )
      expect(container.querySelector('text')).toBeNull()
    })

    it('still renders colored rects in plain mode', () => {
      const { container } = render(
        <Treemap data={data} title="Plain" plain width={400} height={300} />,
      )
      const rects = container.querySelectorAll('rect[fill-opacity]')
      expect(rects.length).toBeGreaterThan(0)
    })

    it('respects explicit width/height in plain mode', () => {
      const { container } = render(
        <Treemap data={data} title="Plain" plain width={120} height={32} />,
      )
      const svg = container.querySelector('svg')
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 32')
    })
  })
})
