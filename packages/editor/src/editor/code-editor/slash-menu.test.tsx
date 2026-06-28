import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SlashMenu } from './slash-menu.tsx'

const items = [
  { id: 'a', label: 'Alpha', hint: '⌘1' },
  { id: 'b', label: 'Beta' },
]

describe('SlashMenu', () => {
  it('renders an option per item with listbox semantics', () => {
    render(
      <SlashMenu id="m" items={items} activeIndex={0} onSelect={() => {}} onHover={() => {}} />,
    )
    expect(screen.getByRole('listbox')).toBeTruthy()
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(2)
    expect(options[0]!.getAttribute('aria-selected')).toBe('true')
    expect(options[1]!.getAttribute('aria-selected')).toBe('false')
    expect(options[0]!.id).toBe('m-opt-0')
  })

  it('shows the empty state when there are no items', () => {
    render(<SlashMenu id="m" items={[]} activeIndex={0} onSelect={() => {}} onHover={() => {}} />)
    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(screen.getByText('No commands')).toBeTruthy()
  })

  it('selects on mousedown without blurring the textarea (preventDefault)', () => {
    const onSelect = vi.fn()
    render(
      <SlashMenu id="m" items={items} activeIndex={0} onSelect={onSelect} onHover={() => {}} />,
    )
    const event = fireEvent.mouseDown(screen.getAllByRole('option')[1]!)
    expect(event).toBe(false) // preventDefault was called
    expect(onSelect).toHaveBeenCalledWith(1)
  })
})
