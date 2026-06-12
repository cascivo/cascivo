import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PageFooter } from './page-footer'

const groups = [
  {
    title: 'Product',
    links: [
      { label: 'Components', href: '/components' },
      { label: 'Charts', href: '/charts' },
    ],
  },
  { title: 'Developers', links: [{ label: 'Docs', href: '/docs' }] },
]

describe('PageFooter', () => {
  it('renders a <footer> element', () => {
    const { container } = render(<PageFooter groups={groups} />)
    expect(container.querySelector('footer')).not.toBeNull()
  })

  it('renders a <nav aria-label="Footer">', () => {
    const { container } = render(<PageFooter groups={groups} />)
    expect(container.querySelector('nav[aria-label="Footer"]')).not.toBeNull()
  })

  it('renders all group titles', () => {
    const { getByText } = render(<PageFooter groups={groups} />)
    expect(getByText('Product')).toBeInTheDocument()
    expect(getByText('Developers')).toBeInTheDocument()
  })

  it('renders all links', () => {
    const { getByText } = render(<PageFooter groups={groups} />)
    expect(getByText('Components')).toBeInTheDocument()
    expect(getByText('Charts')).toBeInTheDocument()
    expect(getByText('Docs')).toBeInTheDocument()
  })

  it('renders brand when provided', () => {
    const { getByText } = render(<PageFooter groups={[]} brand="Cascade" />)
    expect(getByText('Cascade')).toBeInTheDocument()
  })

  it('renders meta when provided', () => {
    const { getByText } = render(<PageFooter groups={[]} meta="MIT licensed." />)
    expect(getByText('MIT licensed.')).toBeInTheDocument()
  })

  it('does not render bottom row when brand and meta are absent', () => {
    const { container } = render(<PageFooter groups={groups} />)
    const bottomRow = container.querySelector('footer > div > div:last-child')
    expect(bottomRow?.querySelector('.brand')).toBeFalsy()
  })
})
