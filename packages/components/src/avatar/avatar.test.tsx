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

  it('derives two-letter initials from a two-word name', () => {
    render(<Avatar name="Ada Lovelace" />)
    const root = screen.getByRole('img', { name: 'Ada Lovelace' })
    expect(root).toHaveTextContent('AL')
  })

  it('derives a single initial from a one-word name', () => {
    render(<Avatar name="Cher" />)
    expect(screen.getByRole('img', { name: 'Cher' })).toHaveTextContent('C')
  })

  it('uses the first and last word for a multi-word name', () => {
    render(<Avatar name="Ada King Lovelace" />)
    expect(screen.getByText('AL')).toBeInTheDocument()
  })

  it('explicit fallback overrides initials from name', () => {
    render(<Avatar name="Ada Lovelace" fallback="99" />)
    expect(screen.getByText('99')).toBeInTheDocument()
    // name still provides the accessible label
    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toBeInTheDocument()
  })

  it('name provides the image alt when src is set and alt is omitted', () => {
    render(<Avatar src="/ada.jpg" name="Ada Lovelace" />)
    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toHaveAttribute('src', '/ada.jpg')
  })
})
