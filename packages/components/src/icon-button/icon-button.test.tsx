import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IconButton } from './icon-button'

afterEach(cleanup)

describe('IconButton', () => {
  it('uses label as the accessible name', () => {
    render(<IconButton label="Settings">⚙</IconButton>)
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
  })

  it('renders the icon prop when no children given', () => {
    render(<IconButton label="Add" icon={<span data-testid="icon">+</span>} />)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('applies variant and size data attributes', () => {
    render(
      <IconButton label="Edit" variant="filled" size="lg">
        ✎
      </IconButton>,
    )
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('data-variant', 'filled')
    expect(btn).toHaveAttribute('data-size', 'lg')
  })

  it('renders a native button of type button', () => {
    render(<IconButton label="Close">×</IconButton>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('is disabled when disabled prop is set', () => {
    render(
      <IconButton label="Close" disabled>
        ×
      </IconButton>,
    )
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('calls onClick when clicked', async () => {
    const handler = vi.fn()
    render(
      <IconButton label="Close" onClick={handler}>
        ×
      </IconButton>,
    )
    await userEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledOnce()
  })

  it('renders the child element when asChild and keeps the label', () => {
    render(
      <IconButton label="Home" asChild>
        <a href="/home">🏠</a>
      </IconButton>,
    )
    const link = screen.getByRole('link', { name: 'Home' })
    expect(link).toHaveAttribute('href', '/home')
  })
})
