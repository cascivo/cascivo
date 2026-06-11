import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card'

describe('HoverCard', () => {
  it('shows content on hover (with zero delay)', async () => {
    const { container } = render(
      <HoverCard openDelay={0} closeDelay={0}>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent>Preview content</HoverCardContent>
      </HoverCard>,
    )
    // jsdom hides popover elements from accessibility tree; query by attribute
    const el = container.querySelector('[role="complementary"]')
    expect(el?.getAttribute('data-state')).toBe('closed')
    await userEvent.hover(screen.getByText('Hover me'))
    expect(el?.getAttribute('data-state')).toBe('open')
  })

  it('hides content on unhover (with zero delay)', async () => {
    const { container } = render(
      <HoverCard openDelay={0} closeDelay={0}>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent>Preview content</HoverCardContent>
      </HoverCard>,
    )
    const el = container.querySelector('[role="complementary"]')
    await userEvent.hover(screen.getByText('Hover me'))
    expect(el?.getAttribute('data-state')).toBe('open')
    await userEvent.unhover(screen.getByText('Hover me'))
    expect(el?.getAttribute('data-state')).toBe('closed')
  })

  it('starts closed', () => {
    const { container } = render(
      <HoverCard>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent>Preview content</HoverCardContent>
      </HoverCard>,
    )
    const el = container.querySelector('[role="complementary"]')
    expect(el?.getAttribute('data-state')).toBe('closed')
  })
})
