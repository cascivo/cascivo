import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Cta } from './cta'

describe('Cta', () => {
  it('renders h2 by default', () => {
    const { container } = render(<Cta title="Ready?" />)
    expect(container.querySelector('h2')).not.toBeNull()
  })

  it('renders h1 with headingLevel={1}', () => {
    const { container } = render(<Cta title="Ready?" headingLevel={1} />)
    expect(container.querySelector('h1')).not.toBeNull()
    expect(container.querySelector('h2')).toBeNull()
  })

  it('renders title text', () => {
    const { getByText } = render(<Cta title="Ready to ship?" />)
    expect(getByText('Ready to ship?')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    const { getByText } = render(<Cta title="T" description="Add Cascade today." />)
    expect(getByText('Add Cascade today.')).toBeInTheDocument()
  })

  it('renders actions when provided', () => {
    const { getByText } = render(<Cta title="T" actions={<button>Start</button>} />)
    expect(getByText('Start')).toBeInTheDocument()
  })

  it('merges className', () => {
    const { container } = render(<Cta title="T" className="extra" />)
    expect((container.firstChild as HTMLElement).className).toContain('extra')
  })
})
