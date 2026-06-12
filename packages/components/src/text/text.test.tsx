import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Text } from './text'

describe('Text', () => {
  it('renders a p with md size and normal weight by default', () => {
    render(<Text>Body copy</Text>)
    const el = screen.getByText('Body copy')
    expect(el.tagName).toBe('P')
    expect(el).toHaveAttribute('data-size', 'md')
    expect(el).toHaveAttribute('data-weight', 'normal')
    expect(el).not.toHaveAttribute('data-muted')
  })

  it('renders the element given by as', () => {
    render(<Text as="span">Inline</Text>)
    expect(screen.getByText('Inline').tagName).toBe('SPAN')
  })

  it('applies size and weight data attributes', () => {
    render(
      <Text size="lg" weight="semibold">
        Lead
      </Text>,
    )
    const el = screen.getByText('Lead')
    expect(el).toHaveAttribute('data-size', 'lg')
    expect(el).toHaveAttribute('data-weight', 'semibold')
  })

  it('marks muted text with data-muted', () => {
    render(<Text muted>Secondary</Text>)
    expect(screen.getByText('Secondary')).toHaveAttribute('data-muted', '')
  })

  it('forwards arbitrary attributes and merges className', () => {
    render(
      <Text className="custom" id="lede">
        Lede
      </Text>,
    )
    const el = screen.getByText('Lede')
    expect(el).toHaveClass('custom')
    expect(el).toHaveAttribute('id', 'lede')
  })
})
