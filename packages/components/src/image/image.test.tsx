import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Image } from './image'

describe('Image', () => {
  it('renders an <img> and starts in the loading state', () => {
    const { container } = render(<Image src="/photo.jpg" alt="A photo" />)
    const img = screen.getByAltText('A photo')
    expect(img).toHaveAttribute('src', '/photo.jpg')
    expect(container.querySelector('[data-state="loading"]')).toBeInTheDocument()
  })

  it('transitions to loaded when the image fires load', () => {
    const { container } = render(<Image src="/photo.jpg" alt="A photo" />)
    fireEvent.load(screen.getByAltText('A photo'))
    expect(container.querySelector('[data-state="loaded"]')).toBeInTheDocument()
  })

  it('uses fallbackSrc when the image errors', () => {
    render(<Image src="/broken.jpg" fallbackSrc="/placeholder.jpg" alt="A photo" />)
    fireEvent.error(screen.getByAltText('A photo'))
    expect(screen.getByAltText('A photo')).toHaveAttribute('src', '/placeholder.jpg')
  })

  it('renders a neutral fallback box on error without fallbackSrc', () => {
    const { container } = render(<Image src="/broken.jpg" alt="A photo" />)
    fireEvent.error(screen.getByAltText('A photo'))
    expect(container.querySelector('[data-state="error"]')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'A photo' })).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })

  it('renders a bare <img> with removeWrapper (no wrapper)', () => {
    const { container } = render(<Image src="/photo.jpg" alt="A photo" removeWrapper />)
    expect(container.querySelector('[data-state]')).toBeNull()
    expect(container.firstElementChild?.tagName).toBe('IMG')
  })

  it('does not import banned React hooks', () => {
    const here = dirname(fileURLToPath(import.meta.url))
    const source = readFileSync(join(here, 'image.tsx'), 'utf8')
    expect(source).not.toMatch(/\buseState\b|\buseEffect\b|\buseContext\b|\buseReducer\b/)
  })
})
