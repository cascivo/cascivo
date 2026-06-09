import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Content</Card>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('applies variant data attribute', () => {
    const { container } = render(<Card variant="elevated">Content</Card>)
    expect(container.firstChild).toHaveAttribute('data-variant', 'elevated')
  })

  it('applies padding data attribute', () => {
    const { container } = render(<Card padding="lg">Content</Card>)
    expect(container.firstChild).toHaveAttribute('data-padding', 'lg')
  })

  it('renders all subcomponents', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>My Title</CardTitle>
        </CardHeader>
        <CardContent>My Content</CardContent>
        <CardFooter>My Footer</CardFooter>
      </Card>
    )
    expect(screen.getByText('My Title')).toBeInTheDocument()
    expect(screen.getByText('My Content')).toBeInTheDocument()
    expect(screen.getByText('My Footer')).toBeInTheDocument()
  })
})
