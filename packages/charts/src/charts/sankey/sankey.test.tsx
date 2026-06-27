import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sankey } from './sankey'

const nodes = [
  { id: 'a', label: 'Search' },
  { id: 'b', label: 'Home' },
  { id: 'c', label: 'Signup' },
  { id: 'd', label: 'Paid' },
]
const links = [
  { source: 'a', target: 'b', value: 30 },
  { source: 'b', target: 'c', value: 18 },
  { source: 'c', target: 'd', value: 7 },
]

describe('Sankey', () => {
  it('renders with an accessible title', () => {
    render(<Sankey nodes={nodes} links={links} title="Flow" width={500} height={300} />)
    expect(screen.getByRole('img', { name: 'Flow' })).toBeTruthy()
  })
  it('renders a node rect per node and a ribbon per link', () => {
    const { container } = render(
      <Sankey nodes={nodes} links={links} title="Flow" width={500} height={300} />,
    )
    expect(container.querySelectorAll('[data-node]').length).toBe(4)
    expect(container.querySelectorAll('path[data-link]').length).toBe(3)
  })
  it('keeps a from/to/value fallback table', () => {
    const { container } = render(
      <Sankey nodes={nodes} links={links} title="Flow" width={500} height={300} />,
    )
    expect(container.querySelector('table')?.textContent).toContain('Search')
  })
})
