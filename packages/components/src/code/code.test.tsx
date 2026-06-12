import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Code } from './code'

describe('Code', () => {
  it('renders children inside a code element', () => {
    render(<Code>npm install</Code>)
    const el = screen.getByText('npm install')
    expect(el.tagName).toBe('CODE')
  })

  it('defaults to md size', () => {
    render(<Code>x</Code>)
    expect(screen.getByText('x')).toHaveAttribute('data-size', 'md')
  })

  it('applies the size data attribute', () => {
    render(<Code size="sm">y</Code>)
    expect(screen.getByText('y')).toHaveAttribute('data-size', 'sm')
  })

  it('forwards arbitrary attributes and merges className', () => {
    render(
      <Code className="custom" title="snippet">
        cn()
      </Code>,
    )
    const el = screen.getByText('cn()')
    expect(el).toHaveClass('custom')
    expect(el).toHaveAttribute('title', 'snippet')
  })
})
