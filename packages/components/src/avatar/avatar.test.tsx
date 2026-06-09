import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { Avatar } from './avatar'

describe('Avatar', () => {
  it('renders an image when src is provided', () => {
    render(<Avatar src="/jane.jpg" alt="Jane Doe" />)
    expect(screen.getByRole('img', { name: 'Jane Doe' })).toHaveAttribute('src', '/jane.jpg')
  })

  it('renders the fallback when no src is provided', () => {
    render(<Avatar fallback="JD" alt="Jane Doe" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Jane Doe' })).toBeInTheDocument()
  })

  it('falls back to initials when the image fails to load', () => {
    render(<Avatar src="/broken.jpg" alt="Jane Doe" fallback="JD" />)
    fireEvent.error(screen.getByRole('img'))
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('renders a status indicator', () => {
    render(<Avatar fallback="JD" status="online" />)
    const root = screen.getByRole('img')
    expect(root).toHaveAttribute('data-status', 'online')
  })
})
