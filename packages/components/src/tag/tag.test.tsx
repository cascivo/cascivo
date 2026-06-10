import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tag } from './tag'

describe('Tag', () => {
  it('renders children', () => {
    render(<Tag>Design</Tag>)
    expect(screen.getByText('Design')).toBeInTheDocument()
  })

  it('applies default variant and size data attributes', () => {
    render(<Tag>Design</Tag>)
    const tag = screen.getByText('Design')
    expect(tag).toHaveAttribute('data-variant', 'default')
    expect(tag).toHaveAttribute('data-size', 'md')
  })

  it('applies variant data attribute', () => {
    render(<Tag variant="error">Failed</Tag>)
    expect(screen.getByText('Failed')).toHaveAttribute('data-variant', 'error')
  })

  it('applies size data attribute', () => {
    render(<Tag size="sm">Small</Tag>)
    expect(screen.getByText('Small')).toHaveAttribute('data-size', 'sm')
  })

  it('does not render a dismiss button without onDismiss', () => {
    render(<Tag>Design</Tag>)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders a dismiss button with default label and calls onDismiss', async () => {
    const handler = vi.fn()
    render(<Tag onDismiss={handler}>Design</Tag>)
    const button = screen.getByRole('button', { name: 'Remove' })
    await userEvent.click(button)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('uses a custom dismissLabel', () => {
    render(
      <Tag onDismiss={() => {}} dismissLabel="Entfernen">
        Design
      </Tag>,
    )
    expect(screen.getByRole('button', { name: 'Entfernen' })).toBeInTheDocument()
  })

  it('merges custom className', () => {
    render(<Tag className="custom">Design</Tag>)
    expect(screen.getByText('Design')).toHaveClass('custom')
  })
})
