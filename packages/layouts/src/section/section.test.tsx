import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Section } from './section'

describe('Section', () => {
  it('renders a <section> element', () => {
    const { container } = render(<Section>content</Section>)
    expect(container.querySelector('section')).not.toBeNull()
  })

  it('renders children', () => {
    const { getByText } = render(
      <Section>
        <p>Hello</p>
      </Section>,
    )
    expect(getByText('Hello')).toBeInTheDocument()
  })

  it('sets --_max for content width', () => {
    const { container } = render(<Section width="content" />)
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--_max')).toBe('72rem')
  })

  it('sets --_max for wide width', () => {
    const { container } = render(<Section width="wide" />)
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--_max')).toBe('90rem')
  })

  it('sets --_max for full width', () => {
    const { container } = render(<Section width="full" />)
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--_max')).toBe('none')
  })

  it('sets --_gap from gap prop', () => {
    const { container } = render(<Section gap={6} />)
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--_gap')).toBe(
      'var(--cascade-space-6)',
    )
  })

  it('merges className', () => {
    const { container } = render(<Section className="extra" />)
    expect((container.firstChild as HTMLElement).className).toContain('extra')
  })
})
