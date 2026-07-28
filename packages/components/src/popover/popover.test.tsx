import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { IconButton } from '../icon-button/icon-button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

describe('Popover', () => {
  it('shows content on trigger click', async () => {
    const { container } = render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>,
    )
    // Content exists in DOM but is hidden initially
    const popoverEl = container.querySelector('[role="dialog"]')
    expect(popoverEl?.getAttribute('data-state')).toBe('closed')
    await userEvent.click(screen.getByText('Open'))
    // After click, data-state should be open
    expect(popoverEl?.getAttribute('data-state')).toBe('open')
  })

  it('respects controlled open prop', () => {
    const { container } = render(
      <Popover open={true}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>,
    )
    const popoverEl = container.querySelector('[role="dialog"]')
    expect(popoverEl?.getAttribute('data-state')).toBe('open')
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

  // `asChild` was typed, documented and accepted at runtime while doing nothing at all:
  // the prop was declared and never read, so the trigger always rendered its own <button>
  // around the child. `<IconButton>` inside it produced a <button> nested in a <button> —
  // invalid HTML, and it orphaned the icon button's aria-label on an element the
  // accessibility tree does not expect to find inside a button (2026-07-28 report C19).
  // The reporter proved the prop was inert by diffing outerHTML with and without it and
  // getting byte-identical output, so that is exactly what these assert.
  describe('asChild', () => {
    it('renders the child element itself, with no wrapper button', () => {
      const { container } = render(
        <Popover>
          <PopoverTrigger asChild>
            <IconButton label="Theme: light" icon={<span>🎨</span>} />
          </PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>,
      )
      const buttons = container.querySelectorAll('button')
      expect(buttons).toHaveLength(1)
      expect(buttons[0]!.querySelector('button')).toBeNull()

      // The trigger's behaviour has to survive being merged onto the child.
      const trigger = screen.getByRole('button', { name: 'Theme: light' })
      expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
      expect(trigger.getAttribute('aria-expanded')).toBe('false')
    })

    it('drives the popover from the merged child', async () => {
      const { container } = render(
        <Popover>
          <PopoverTrigger asChild>
            <IconButton label="Theme: light" icon={<span>🎨</span>} />
          </PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>,
      )
      const popoverEl = container.querySelector('[role="dialog"]')
      expect(popoverEl?.getAttribute('data-state')).toBe('closed')
      await userEvent.click(screen.getByRole('button', { name: 'Theme: light' }))
      expect(popoverEl?.getAttribute('data-state')).toBe('open')
    })

    it('changes the rendered output — the prop is not inert', () => {
      const tree = (asChild: boolean) => (
        <Popover>
          <PopoverTrigger asChild={asChild}>
            <IconButton label="Theme: light" icon={<span>🎨</span>} />
          </PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )
      const withAsChild = render(tree(true)).container.innerHTML
      const withoutAsChild = render(tree(false)).container.innerHTML
      expect(withAsChild).not.toBe(withoutAsChild)
    })
  })
})
