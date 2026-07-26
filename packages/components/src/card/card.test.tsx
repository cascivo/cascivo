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
      </Card>,
    )
    expect(screen.getByText('My Title')).toBeInTheDocument()
    expect(screen.getByText('My Content')).toBeInTheDocument()
    expect(screen.getByText('My Footer')).toBeInTheDocument()
  })
})

describe('CardHeader actions (title + action row)', () => {
  it('renders actions after the title in DOM order', () => {
    render(
      <Card>
        <CardHeader actions={<button type="button">Menu</button>}>
          <CardTitle>Project</CardTitle>
        </CardHeader>
      </Card>,
    )
    const title = screen.getByText('Project')
    const action = screen.getByRole('button', { name: 'Menu' })
    expect(title.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('keeps the plain column header when no actions are passed', () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Project</CardTitle>
        </CardHeader>
      </Card>,
    )
    // No extra wrapper divs: the children stay direct descendants of the header.
    const header = container.querySelector('h3')!.parentElement!
    expect(header.className).not.toMatch(/headerRow/)
  })
})
