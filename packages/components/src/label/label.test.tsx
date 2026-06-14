import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Label } from './label'

afterEach(cleanup)

describe('Label', () => {
  it('renders a native label associated via htmlFor', () => {
    render(<Label htmlFor="email">Email</Label>)
    const label = screen.getByText('Email')
    expect(label.tagName).toBe('LABEL')
    expect(label).toHaveAttribute('for', 'email')
  })

  it('renders into the child element when asChild', () => {
    render(
      <Label asChild htmlFor="email">
        <span data-testid="custom">Email</span>
      </Label>,
    )
    const el = screen.getByTestId('custom')
    expect(el.tagName).toBe('SPAN')
    expect(el).toHaveAttribute('for', 'email')
  })

  it('shows an accessible required marker', () => {
    render(<Label required>Email</Label>)
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Required')).toBeInTheDocument()
  })

  it('omits the required marker by default', () => {
    render(<Label>Email</Label>)
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  it('sets data-disabled when disabled', () => {
    render(<Label disabled>Email</Label>)
    expect(screen.getByText('Email')).toHaveAttribute('data-disabled', '')
  })
})
