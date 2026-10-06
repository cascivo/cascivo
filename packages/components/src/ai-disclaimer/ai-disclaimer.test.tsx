import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AiDisclaimer } from './ai-disclaimer'

describe('AiDisclaimer', () => {
  it('renders the default notice in a paragraph', () => {
    render(<AiDisclaimer />)
    const text = screen.getByText('AI-generated content may be incorrect.')
    expect(text.closest('p')).not.toBeNull()
  })

  it('is not a live region', () => {
    const { container } = render(<AiDisclaimer />)
    expect(container.firstElementChild).not.toHaveAttribute('role')
    expect(container.firstElementChild).not.toHaveAttribute('aria-live')
  })

  it('prefers children, then labels', () => {
    const { rerender } = render(<AiDisclaimer labels={{ text: 'KI kann irren.' }} />)
    expect(screen.getByText('KI kann irren.')).toBeInTheDocument()
    rerender(<AiDisclaimer>Check the figures.</AiDisclaimer>)
    expect(screen.getByText('Check the figures.')).toBeInTheDocument()
  })

  it('hides the glyph from assistive technology', () => {
    const { container } = render(<AiDisclaimer />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
