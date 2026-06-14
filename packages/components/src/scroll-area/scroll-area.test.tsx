import { afterEach, describe, it, expect } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ScrollArea } from './scroll-area'

afterEach(cleanup)

describe('ScrollArea', () => {
  it('renders its children', () => {
    render(<ScrollArea>Scrollable</ScrollArea>)
    expect(screen.getByText('Scrollable')).toBeInTheDocument()
  })

  it('defaults to vertical orientation', () => {
    render(<ScrollArea data-testid="sa">Content</ScrollArea>)
    expect(screen.getByTestId('sa')).toHaveAttribute('data-orientation', 'vertical')
  })

  it('reflects the orientation prop on a data attribute', () => {
    render(
      <ScrollArea orientation="both" data-testid="sa">
        Content
      </ScrollArea>,
    )
    expect(screen.getByTestId('sa')).toHaveAttribute('data-orientation', 'both')
  })

  it('applies height and width via custom properties', () => {
    render(
      <ScrollArea height="10rem" width="20rem" data-testid="sa">
        Content
      </ScrollArea>,
    )
    const node = screen.getByTestId('sa')
    expect(node.style.getPropertyValue('--cascivo-scroll-area-height')).toBe('10rem')
    expect(node.style.getPropertyValue('--cascivo-scroll-area-width')).toBe('20rem')
  })
})
