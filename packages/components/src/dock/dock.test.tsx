import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Dock } from './dock'

const defaultItems = [
  { label: 'Home', icon: '🏠' },
  { label: 'Search', icon: '🔍' },
  { label: 'Profile', icon: '👤' },
]

describe('Dock', () => {
  it('renders the correct number of items', () => {
    render(<Dock items={defaultItems} />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Search')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })

  it('item at activeIndex has data-active and aria-current="page"', () => {
    render(<Dock items={defaultItems} activeIndex={1} />)
    const searchLabel = screen.getByText('Search')
    const item = searchLabel.closest('button, a') as HTMLElement
    expect(item).toHaveAttribute('data-active')
    expect(item).toHaveAttribute('aria-current', 'page')
  })

  it('items without activeIndex have no data-active', () => {
    render(<Dock items={defaultItems} />)
    const homeLabel = screen.getByText('Home')
    const item = homeLabel.closest('button, a') as HTMLElement
    expect(item).not.toHaveAttribute('data-active')
  })

  it('non-active items do not have data-active even when another is active', () => {
    render(<Dock items={defaultItems} activeIndex={0} />)
    const searchLabel = screen.getByText('Search')
    const item = searchLabel.closest('button, a') as HTMLElement
    expect(item).not.toHaveAttribute('data-active')
  })

  it('renders <a> when item has href', () => {
    const items = [{ label: 'Home', icon: '🏠', href: '/home' }]
    render(<Dock items={items} />)
    const link = screen.getByText('Home').closest('a')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/home')
  })

  it('renders <button> when item has no href', () => {
    const items = [{ label: 'Home', icon: '🏠', onClick: vi.fn() }]
    render(<Dock items={items} />)
    const btn = screen.getByText('Home').closest('button')
    expect(btn).toBeInTheDocument()
  })

  it('calls onClick when a button item is clicked', () => {
    const handleClick = vi.fn()
    const items = [{ label: 'Home', icon: '🏠', onClick: handleClick }]
    render(<Dock items={items} />)
    const btn = screen.getByText('Home').closest('button') as HTMLElement
    fireEvent.click(btn)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
