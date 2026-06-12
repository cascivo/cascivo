import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Blockquote } from './blockquote'

describe('Blockquote', () => {
  it('renders children inside a blockquote element', () => {
    render(<Blockquote>Less, but better.</Blockquote>)
    const el = screen.getByText('Less, but better.')
    expect(el.closest('blockquote')).not.toBeNull()
  })

  it('renders no footer without cite', () => {
    const { container } = render(<Blockquote>Quote</Blockquote>)
    expect(container.querySelector('footer')).toBeNull()
    expect(container.querySelector('cite')).toBeNull()
  })

  it('renders the attribution in a footer > cite when cite is given', () => {
    const { container } = render(<Blockquote cite="Dieter Rams">Less, but better.</Blockquote>)
    const cite = container.querySelector('footer > cite')
    expect(cite).not.toBeNull()
    expect(cite).toHaveTextContent('Dieter Rams')
  })

  it('forwards arbitrary attributes and merges className', () => {
    const { container } = render(
      <Blockquote className="custom" lang="de">
        Weniger, aber besser.
      </Blockquote>,
    )
    const el = container.querySelector('blockquote')
    expect(el).toHaveClass('custom')
    expect(el).toHaveAttribute('lang', 'de')
  })
})
