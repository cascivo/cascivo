import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QrCode } from './qr-code'

describe('QrCode', () => {
  it('renders an SVG with the default accessible label', () => {
    const { container } = render(<QrCode value="https://cascivo.dev" />)
    const svg = screen.getByRole('img')
    expect(svg.tagName.toLowerCase()).toBe('svg')
    expect(svg).toHaveAttribute('aria-label', 'QR code')
    // The dark modules are drawn as a single path.
    expect(container.querySelector('path')?.getAttribute('d')).toBeTruthy()
  })

  it('uses a custom label when provided', () => {
    render(<QrCode value="cascivo" label="Scan to open cascivo" />)
    expect(screen.getByRole('img', { name: 'Scan to open cascivo' })).toBeInTheDocument()
  })

  it('renders nothing for an empty value', () => {
    const { container } = render(<QrCode value="" />)
    expect(container.firstChild).toBeNull()
  })

  it('applies fill and background colors', () => {
    const { container } = render(<QrCode value="cascivo" fill="#123456" background="#abcdef" />)
    expect(container.querySelector('path')).toHaveAttribute('fill', '#123456')
    expect(container.querySelector('rect')).toHaveAttribute('fill', '#abcdef')
  })
})
