import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

describe('Popover', () => {
  it('shows content on trigger click', async () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>,
    )
    // Content exists in DOM but is hidden via popover attribute
    await userEvent.click(screen.getByText('Open'))
    // After click, data-state should be open
    expect(screen.getByRole('dialog').getAttribute('data-state')).toBe('open')
  })

  it('respects controlled open prop', () => {
    render(
      <Popover open={true}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>,
    )
    expect(screen.getByRole('dialog').getAttribute('data-state')).toBe('open')
  })

  it('toggle button has aria-expanded', async () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>,
    )
    const btn = screen.getByRole('button', { name: 'Open' })
    expect(btn.getAttribute('aria-expanded')).toBe('false')
    await userEvent.click(btn)
    expect(btn.getAttribute('aria-expanded')).toBe('true')
  })
})
