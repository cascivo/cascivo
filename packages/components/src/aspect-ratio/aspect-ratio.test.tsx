import { afterEach, describe, it, expect } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { AspectRatio } from './aspect-ratio'

afterEach(cleanup)

describe('AspectRatio', () => {
  it('renders its children', () => {
    render(
      <AspectRatio>
        <img src="/cover.jpg" alt="Cover" />
      </AspectRatio>,
    )
    expect(screen.getByAltText('Cover')).toBeInTheDocument()
  })

  it('sets the aspect-ratio custom property from the ratio prop', () => {
    const { container } = render(<AspectRatio ratio={4 / 3} data-testid="ar" />)
    const root = container.firstElementChild as HTMLElement
    expect(root.style.getPropertyValue('--cascivo-aspect-ratio')).toBe(String(4 / 3))
  })

  it('defaults to a 16/9 ratio', () => {
    const { container } = render(<AspectRatio />)
    const root = container.firstElementChild as HTMLElement
    expect(root.style.getPropertyValue('--cascivo-aspect-ratio')).toBe(String(16 / 9))
  })

  it('forwards arbitrary div attributes', () => {
    render(<AspectRatio data-testid="ar" />)
    expect(screen.getByTestId('ar')).toBeInTheDocument()
  })
})
