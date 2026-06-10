import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Breadcrumb } from './breadcrumb'

const items = [
  { label: 'Home', href: '/' },
  { label: 'Docs', href: '/docs' },
  { label: 'Components', href: '/docs/components' },
  { label: 'Breadcrumb' },
]

describe('Breadcrumb', () => {
  it('renders a nav landmark labeled Breadcrumb', () => {
    render(<Breadcrumb items={items} />)
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument()
  })

  it('allows overriding the nav label', () => {
    render(<Breadcrumb items={items} ariaLabel="Fil d’Ariane" />)
    expect(screen.getByRole('navigation', { name: 'Fil d’Ariane' })).toBeInTheDocument()
  })

  it('renders one list item per breadcrumb item', () => {
    render(<Breadcrumb items={items} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })

  it('renders items with href as links', () => {
    render(<Breadcrumb items={items} />)
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs')
  })

  it('renders the last item as plain text with aria-current', () => {
    render(<Breadcrumb items={items} />)
    const current = screen.getByText('Breadcrumb')
    expect(current.tagName).toBe('SPAN')
    expect(current).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('link', { name: 'Breadcrumb' })).not.toBeInTheDocument()
  })

  it('renders the last item as plain text even when it has an href', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Current', href: '/current' },
        ]}
      />,
    )
    expect(screen.queryByRole('link', { name: 'Current' })).not.toBeInTheDocument()
    expect(screen.getByText('Current')).toHaveAttribute('aria-current', 'page')
  })

  it('renders middle items without href as plain text', () => {
    render(
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Section' }, { label: 'Page' }]}
      />,
    )
    const section = screen.getByText('Section')
    expect(section.tagName).toBe('SPAN')
    expect(section).not.toHaveAttribute('aria-current')
  })

  it('collapses long trails to first item, ellipsis, and trailing items', () => {
    render(<Breadcrumb items={items} maxVisible={3} />)
    const listItems = screen.getAllByRole('listitem')
    expect(listItems).toHaveLength(3)
    expect(listItems[0]).toHaveTextContent('Home')
    expect(listItems[1]).toHaveTextContent('…')
    expect(listItems[2]).toHaveTextContent('Breadcrumb')
    expect(screen.queryByText('Docs')).not.toBeInTheDocument()
    expect(screen.queryByText('Components')).not.toBeInTheDocument()
  })

  it('does not collapse when items fit within maxVisible', () => {
    render(<Breadcrumb items={items} maxVisible={4} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(screen.queryByText('…')).not.toBeInTheDocument()
  })

  it('merges custom className', () => {
    render(<Breadcrumb items={items} className="custom" />)
    expect(screen.getByRole('navigation')).toHaveClass('custom')
  })
})
