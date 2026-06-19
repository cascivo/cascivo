import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Testimonials } from './testimonials'

describe('Testimonials', () => {
  it('renders a labeled testimonials section', () => {
    render(<Testimonials />)
    expect(screen.getByRole('region', { name: /customer testimonials/i })).toBeInTheDocument()
  })

  it('renders each quote with its attribution', () => {
    render(<Testimonials />)
    expect(screen.getByText('Ada Okonkwo')).toBeInTheDocument()
    expect(screen.getByText('Marco Bianchi')).toBeInTheDocument()
    expect(screen.getByText('Priya Nair')).toBeInTheDocument()
  })

  it('renders an avatar fallback per testimonial', () => {
    render(<Testimonials />)
    expect(screen.getByText('AO')).toBeInTheDocument()
    expect(screen.getByText('PN')).toBeInTheDocument()
  })
})
