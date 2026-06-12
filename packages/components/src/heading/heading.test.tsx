import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Heading } from './heading'

describe('Heading', () => {
  it('renders an h2 by default', () => {
    render(<Heading>Section</Heading>)
    const el = screen.getByRole('heading', { level: 2 })
    expect(el).toHaveTextContent('Section')
    expect(el.tagName).toBe('H2')
  })

  it('renders the element matching level', () => {
    render(<Heading level={4}>Sub</Heading>)
    expect(screen.getByRole('heading', { level: 4 }).tagName).toBe('H4')
  })

  it('derives size from level when size is absent', () => {
    const cases: Array<[1 | 2 | 3 | 4 | 5 | 6, string]> = [
      [1, '2xl'],
      [2, 'xl'],
      [3, 'lg'],
      [4, 'md'],
      [5, 'sm'],
      [6, 'sm'],
    ]
    for (const [level, size] of cases) {
      const { unmount } = render(<Heading level={level}>T</Heading>)
      expect(screen.getByRole('heading', { level })).toHaveAttribute('data-size', size)
      unmount()
    }
  })

  it('explicit size overrides the derived size', () => {
    render(
      <Heading level={1} size="sm">
        Small h1
      </Heading>,
    )
    const el = screen.getByRole('heading', { level: 1 })
    expect(el.tagName).toBe('H1')
    expect(el).toHaveAttribute('data-size', 'sm')
  })

  it('forwards arbitrary attributes and merges className', () => {
    render(
      <Heading className="custom" id="intro">
        Intro
      </Heading>,
    )
    const el = screen.getByRole('heading', { level: 2 })
    expect(el).toHaveClass('custom')
    expect(el).toHaveAttribute('id', 'intro')
  })
})
