import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Kbd } from './kbd'

describe('Kbd', () => {
  it('renders children inside a kbd element', () => {
    render(<Kbd>Esc</Kbd>)
    const el = screen.getByText('Esc')
    expect(el).toBeInTheDocument()
    expect(el.tagName).toBe('KBD')
  })

  it('defaults to md size', () => {
    render(<Kbd>K</Kbd>)
    expect(screen.getByText('K')).toHaveAttribute('data-size', 'md')
  })

  it('applies the size data attribute', () => {
    render(<Kbd size="sm">K</Kbd>)
    expect(screen.getByText('K')).toHaveAttribute('data-size', 'sm')
  })

  it('forwards arbitrary attributes and merges className', () => {
    render(
      <Kbd className="custom" title="Command">
        ⌘
      </Kbd>,
    )
    const el = screen.getByText('⌘')
    expect(el).toHaveClass('custom')
    expect(el).toHaveAttribute('title', 'Command')
  })
})
