import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InlineCitation } from './inline-citation'

const SOURCE = {
  title: 'Refund policy',
  url: 'https://example.com/refunds',
  description: '30 days',
}

describe('InlineCitation', () => {
  it('is a link named by its number and the source title', () => {
    render(<InlineCitation index={2} source={SOURCE} />)
    const link = screen.getByRole('link', { name: 'Source 2: Refund policy' })
    expect(link).toHaveAttribute('href', 'https://example.com/refunds')
    expect(link).toHaveTextContent('2')
  })

  it('renders in a superscript', () => {
    render(<InlineCitation index={1} source={SOURCE} />)
    expect(screen.getByRole('link').closest('sup')).not.toBeNull()
  })

  it('does not link an unsafe URL but keeps its name', () => {
    render(<InlineCitation index={1} source={{ title: 'Evil', url: 'javascript:alert(1)' }} />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('Source 1: Evil')).toBeInTheDocument()
  })

  it('localises the name', () => {
    render(<InlineCitation index={3} source={SOURCE} labels={{ source: 'Quelle {index}' }} />)
    expect(screen.getByRole('link', { name: 'Quelle 3: Refund policy' })).toBeInTheDocument()
  })
})
