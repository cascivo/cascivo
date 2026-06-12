import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Hero } from './hero'

describe('Hero', () => {
  it('renders h1 by default', () => {
    const { container } = render(<Hero title="Hello" />)
    expect(container.querySelector('h1')).not.toBeNull()
  })

  it('renders h2 with headingLevel={2}', () => {
    const { container } = render(<Hero title="Hello" headingLevel={2} />)
    expect(container.querySelector('h2')).not.toBeNull()
    expect(container.querySelector('h1')).toBeNull()
  })

  it('renders title text', () => {
    const { getByText } = render(<Hero title="Ship it" />)
    expect(getByText('Ship it')).toBeInTheDocument()
  })

  it('renders eyebrow when provided', () => {
    const { getByText } = render(<Hero title="T" eyebrow="v8" />)
    expect(getByText('v8')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    const { getByText } = render(<Hero title="T" description="Desc" />)
    expect(getByText('Desc')).toBeInTheDocument()
  })

  it('renders actions when provided', () => {
    const { getByText } = render(<Hero title="T" actions={<button>CTA</button>} />)
    expect(getByText('CTA')).toBeInTheDocument()
  })

  it('renders media slot in split variant', () => {
    const { getByText } = render(<Hero title="T" variant="split" media={<div>Media</div>} />)
    expect(getByText('Media')).toBeInTheDocument()
  })

  it('does not render media slot in centered variant', () => {
    const { queryByText } = render(<Hero title="T" variant="centered" media={<div>Media</div>} />)
    expect(queryByText('Media')).toBeNull()
  })
})
