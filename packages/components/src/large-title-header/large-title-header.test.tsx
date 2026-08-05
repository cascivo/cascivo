import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { LargeTitleHeader } from './large-title-header'

afterEach(cleanup)

describe('LargeTitleHeader', () => {
  it('renders the title as a level-1 heading by default', () => {
    render(<LargeTitleHeader title="Library">content</LargeTitleHeader>)
    expect(screen.getByRole('heading', { level: 1, name: 'Library' })).toBeInTheDocument()
  })

  it('honours the level prop', () => {
    render(
      <LargeTitleHeader title="Downloads" level={2}>
        content
      </LargeTitleHeader>,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Downloads' })).toBeInTheDocument()
  })

  it('announces the title exactly once despite the visual mirror', () => {
    render(<LargeTitleHeader title="Library">content</LargeTitleHeader>)
    // The compact bar renders a second copy for the collapsed state; it must be
    // aria-hidden, so only the heading is reachable by accessible name.
    expect(screen.getAllByText('Library')).toHaveLength(2)
    expect(screen.getAllByRole('heading', { name: 'Library' })).toHaveLength(1)
  })

  it('renders leading and action slots', () => {
    render(
      <LargeTitleHeader
        title="Downloads"
        leading={<button type="button">Back</button>}
        actions={<button type="button">Sort</button>}
      >
        content
      </LargeTitleHeader>,
    )
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sort' })).toBeInTheDocument()
  })

  it('exposes collapseDistance as the animation range custom property', () => {
    const { container } = render(
      <LargeTitleHeader title="Library" collapseDistance={96}>
        content
      </LargeTitleHeader>,
    )
    const root = container.firstElementChild as HTMLElement
    expect(root.style.getPropertyValue('--_collapse')).toBe('96px')
  })

  it('merges a caller className onto the root', () => {
    const { container } = render(
      <LargeTitleHeader title="Library" className="custom">
        content
      </LargeTitleHeader>,
    )
    expect(container.firstElementChild).toHaveClass('custom')
  })
})
