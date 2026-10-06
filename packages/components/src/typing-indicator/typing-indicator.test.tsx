import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TypingIndicator } from './typing-indicator'

describe('TypingIndicator', () => {
  it('is a named status region', () => {
    render(<TypingIndicator />)
    expect(screen.getByRole('status', { name: 'Assistant is typing' })).toBeInTheDocument()
  })

  it('accepts a custom accessible name', () => {
    render(<TypingIndicator ariaLabel="Ada is typing" />)
    expect(screen.getByRole('status', { name: 'Ada is typing' })).toBeInTheDocument()
  })

  it('accepts label as an alias of ariaLabel', () => {
    render(<TypingIndicator label="Ada is typing" />)
    expect(screen.getByRole('status', { name: 'Ada is typing' })).toBeInTheDocument()
  })

  it('renders three decorative dots', () => {
    render(<TypingIndicator />)
    const dots = screen.getByRole('status').children
    expect(dots).toHaveLength(3)
    for (const dot of Array.from(dots)) expect(dot).toHaveAttribute('aria-hidden', 'true')
  })

  it('merges className', () => {
    render(<TypingIndicator className="custom" />)
    expect(screen.getByRole('status')).toHaveClass('custom')
  })
})
