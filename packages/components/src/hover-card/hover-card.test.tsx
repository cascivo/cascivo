import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card'

describe('HoverCard', () => {
  it('shows content on hover (with zero delay)', async () => {
    render(
      <HoverCard openDelay={0} closeDelay={0}>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent>Preview content</HoverCardContent>
      </HoverCard>,
    )
    await userEvent.hover(screen.getByText('Hover me'))
    // After hover, data-state should be open
    expect(screen.getByRole('complementary').getAttribute('data-state')).toBe('open')
  })

  it('hides content on unhover (with zero delay)', async () => {
    render(
      <HoverCard openDelay={0} closeDelay={0}>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent>Preview content</HoverCardContent>
      </HoverCard>,
    )
    await userEvent.hover(screen.getByText('Hover me'))
    await userEvent.unhover(screen.getByText('Hover me'))
    expect(screen.getByRole('complementary').getAttribute('data-state')).toBe('closed')
  })

  it('starts closed', () => {
    render(
      <HoverCard>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent>Preview content</HoverCardContent>
      </HoverCard>,
    )
    expect(screen.getByRole('complementary').getAttribute('data-state')).toBe('closed')
  })
})
