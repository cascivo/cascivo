import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { Skeleton } from './skeleton'

function renderSkeleton(ui: ReactElement): HTMLElement {
  const { container } = render(ui)
  const root = container.firstElementChild
  if (!(root instanceof HTMLElement)) throw new Error('Skeleton did not render an element')
  return root
}

describe('Skeleton', () => {
  it('is hidden from assistive technology', () => {
    const root = renderSkeleton(<Skeleton />)
    expect(root).toHaveAttribute('aria-hidden', 'true')
  })

  it('defaults to the text variant with a single line', () => {
    const root = renderSkeleton(<Skeleton />)
    expect(root).toHaveAttribute('data-variant', 'text')
    expect(root.children).toHaveLength(1)
  })

  it('renders the requested number of text lines', () => {
    const root = renderSkeleton(<Skeleton lines={3} />)
    expect(root.children).toHaveLength(3)
  })

  it('renders circle and rect variants without line bars', () => {
    const circle = renderSkeleton(<Skeleton variant="circle" />)
    expect(circle).toHaveAttribute('data-variant', 'circle')
    expect(circle.children).toHaveLength(0)

    const rect = renderSkeleton(<Skeleton variant="rect" />)
    expect(rect).toHaveAttribute('data-variant', 'rect')
    expect(rect.children).toHaveLength(0)
  })

  it('applies width and height as inline custom properties', () => {
    const root = renderSkeleton(<Skeleton variant="rect" width="200px" height="4rem" />)
    expect(root.style.getPropertyValue('--cascade-skeleton-width')).toBe('200px')
    expect(root.style.getPropertyValue('--cascade-skeleton-height')).toBe('4rem')
  })

  it('omits size custom properties when not provided', () => {
    const root = renderSkeleton(<Skeleton variant="rect" />)
    expect(root.style.getPropertyValue('--cascade-skeleton-width')).toBe('')
    expect(root.style.getPropertyValue('--cascade-skeleton-height')).toBe('')
  })

  it('merges custom className', () => {
    const root = renderSkeleton(<Skeleton className="custom" />)
    expect(root).toHaveClass('custom')
  })
})
