import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { List, ListItem } from './list'

describe('List', () => {
  it('renders a ul with disc marker by default', () => {
    render(
      <List>
        <ListItem>One</ListItem>
      </List>,
    )
    const el = screen.getByRole('list')
    expect(el.tagName).toBe('UL')
    expect(el).toHaveAttribute('data-marker', 'disc')
  })

  it('renders an ol with decimal marker by default when as="ol"', () => {
    render(
      <List as="ol">
        <ListItem>First</ListItem>
      </List>,
    )
    const el = screen.getByRole('list')
    expect(el.tagName).toBe('OL')
    expect(el).toHaveAttribute('data-marker', 'decimal')
  })

  it('explicit marker overrides the derived marker', () => {
    render(
      <List marker="none">
        <ListItem>Bare</ListItem>
      </List>,
    )
    expect(screen.getByRole('list')).toHaveAttribute('data-marker', 'none')
  })

  it('renders ListItem children as li elements', () => {
    render(
      <List>
        <ListItem>One</ListItem>
        <ListItem>Two</ListItem>
      </List>,
    )
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('One')
  })

  it('forwards arbitrary attributes and merges className', () => {
    render(
      <List className="custom" aria-label="Steps">
        <ListItem className="item-custom">One</ListItem>
      </List>,
    )
    expect(screen.getByRole('list')).toHaveClass('custom')
    expect(screen.getByRole('list')).toHaveAttribute('aria-label', 'Steps')
    expect(screen.getByRole('listitem')).toHaveClass('item-custom')
  })
})
