import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from './item'

afterEach(cleanup)

describe('Item', () => {
  it('renders a div by default with default variant and size', () => {
    const { getByText } = render(<Item>Row</Item>)
    const el = getByText('Row')
    expect(el.tagName).toBe('DIV')
    expect(el.getAttribute('data-variant')).toBe('default')
    expect(el.getAttribute('data-size')).toBe('md')
  })

  it('reflects variant and size via data attributes', () => {
    const { getByText } = render(
      <Item variant="muted" size="sm">
        Row
      </Item>,
    )
    const el = getByText('Row')
    expect(el.getAttribute('data-variant')).toBe('muted')
    expect(el.getAttribute('data-size')).toBe('sm')
  })

  it('renders the slotted element when asChild', () => {
    const { getByRole } = render(
      <Item asChild>
        <a href="/profile">Profile</a>
      </Item>,
    )
    const link = getByRole('link', { name: 'Profile' })
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('data-variant')).toBe('default')
  })

  it('renders compound sub-parts', () => {
    const { getByText, container } = render(
      <Item>
        <ItemMedia>M</ItemMedia>
        <ItemContent>
          <ItemTitle>Title</ItemTitle>
          <ItemDescription>Desc</ItemDescription>
        </ItemContent>
        <ItemActions>A</ItemActions>
      </Item>,
    )
    expect(getByText('Title')).toBeDefined()
    expect(getByText('Desc').tagName).toBe('P')
    expect(getByText('M')).toBeDefined()
    expect(getByText('A')).toBeDefined()
    expect(container.querySelector('p')).not.toBeNull()
  })

  it('merges className and forwards attributes', () => {
    const { getByText } = render(
      <Item className="custom" data-testid="row">
        Row
      </Item>,
    )
    const el = getByText('Row')
    expect(el.classList.contains('custom')).toBe(true)
    expect(el.getAttribute('data-testid')).toBe('row')
  })
})
