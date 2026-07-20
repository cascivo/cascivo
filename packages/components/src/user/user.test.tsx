import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { User } from './user'

describe('User', () => {
  it('renders the name and description', () => {
    render(<User name="Jane Doe" description="jane@acme.com" />)
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@acme.com')).toBeInTheDocument()
  })

  it('forwards avatarProps to the composed Avatar', () => {
    render(<User name="Jane Doe" avatarProps={{ src: '/jane.jpg', alt: 'Jane Doe' }} />)
    expect(screen.getByRole('img', { name: 'Jane Doe' })).toHaveAttribute('src', '/jane.jpg')
  })

  it('forwards the string name to the Avatar so it shows initials', () => {
    render(<User name="Jane Doe" />)
    expect(screen.getByRole('img', { name: 'Jane Doe' })).toHaveTextContent('JD')
  })

  it('forwarded name labels the avatar image when avatarProps sets only src', () => {
    render(<User name="Jane Doe" avatarProps={{ src: '/jane.jpg' }} />)
    // name flows through as the image alt (no explicit alt given).
    expect(screen.getByRole('img', { name: 'Jane Doe' })).toHaveAttribute('src', '/jane.jpg')
  })

  it('avatarProps.fallback suppresses name-derived initials', () => {
    render(<User name="Jane Doe" avatarProps={{ fallback: 'XX' }} />)
    expect(screen.getByText('XX')).toBeInTheDocument()
  })

  it('renders the trailing action slot when children are provided', () => {
    render(
      <User name="Jane Doe">
        <button type="button">More</button>
      </User>,
    )
    expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument()
  })

  it('does not import banned React hooks', () => {
    const here = dirname(fileURLToPath(import.meta.url))
    const source = readFileSync(join(here, 'user.tsx'), 'utf8')
    expect(source).not.toMatch(/\buseState\b|\buseEffect\b|\buseContext\b|\buseReducer\b/)
  })
})
