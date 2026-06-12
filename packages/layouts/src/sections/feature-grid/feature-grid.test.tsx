import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { FeatureGrid } from './feature-grid'

const items = [
  { title: 'Zero config', description: 'Works out of the box.' },
  { title: 'Token-first', href: '/tokens', description: 'Own your tokens.' },
]

describe('FeatureGrid', () => {
  it('renders all items', () => {
    const { getByText } = render(<FeatureGrid items={items} />)
    expect(getByText('Zero config')).toBeInTheDocument()
    expect(getByText('Token-first')).toBeInTheDocument()
  })

  it('renders item with href as an anchor', () => {
    const { container } = render(<FeatureGrid items={items} />)
    const anchor = container.querySelector('a[href="/tokens"]')
    expect(anchor).not.toBeNull()
  })

  it('renders item without href as a div', () => {
    const { container } = render(<FeatureGrid items={[items[0]!]} />)
    expect(container.querySelector('a')).toBeNull()
  })

  it('renders section title when provided', () => {
    const { getByText } = render(<FeatureGrid items={[]} title="Features" />)
    expect(getByText('Features')).toBeInTheDocument()
  })

  it('renders h2 by default for section title', () => {
    const { container } = render(<FeatureGrid items={[]} title="Features" />)
    expect(container.querySelector('h2')).not.toBeNull()
  })

  it('renders item headings at headingLevel + 1', () => {
    const { container } = render(<FeatureGrid items={items} headingLevel={2} />)
    expect(container.querySelectorAll('h3').length).toBe(2)
  })
})
