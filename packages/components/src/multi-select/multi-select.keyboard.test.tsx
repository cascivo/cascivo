/**
 * Keyboard, focus and ARIA behaviour — the half of MultiSelect that had no coverage at all,
 * which is how a completely dead keyboard handler shipped: the listener was bound to the
 * listbox while focus went to the search field, a *sibling*, so no key ever reached it.
 *
 * Every test here fails against the pre-fix component.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiSelect } from './multi-select'
import type { MultiSelectOption } from './option-list'

afterEach(cleanup)

const options: MultiSelectOption[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry', disabled: true },
  { label: 'Damson', value: 'damson' },
]

describe('MultiSelect keyboard navigation', () => {
  it('ArrowDown then Enter selects the first option', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<MultiSelect options={options} value={[]} onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button'))
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onValueChange).toHaveBeenCalledWith(['apple'])
  })

  it('accumulates selections instead of replacing them', async () => {
    const user = userEvent.setup()
    let current: string[] = []
    const onValueChange = vi.fn((next: string[]) => {
      current = next
    })
    const { rerender } = render(
      <MultiSelect options={options} value={current} onValueChange={onValueChange} />,
    )
    await user.click(screen.getByRole('button'))
    await user.keyboard('{ArrowDown}{Enter}')
    rerender(<MultiSelect options={options} value={current} onValueChange={onValueChange} />)
    await user.keyboard('{ArrowDown}{Enter}')
    // The second toggle must build on the first — the stale-closure bug returned ['banana'].
    expect(onValueChange).toHaveBeenLastCalledWith(['apple', 'banana'])
  })

  it('ArrowUp enters the list from the end', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} value={[]} onValueChange={() => {}} />)
    await user.click(screen.getByRole('button'))
    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('option', { name: /Damson/ })).toHaveAttribute('data-active', '')
  })

  it('skips a disabled option', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} value={[]} onValueChange={() => {}} />)
    await user.click(screen.getByRole('button'))
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
    // apple -> banana -> damson; cherry is disabled.
    expect(screen.getByRole('option', { name: /Damson/ })).toHaveAttribute('data-active', '')
  })

  it('wraps at the end of the list', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} value={[]} onValueChange={() => {}} />)
    await user.click(screen.getByRole('button'))
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}')
    expect(screen.getByRole('option', { name: /Apple/ })).toHaveAttribute('data-active', '')
  })

  it('Home and End jump to the first and last enabled option', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} value={[]} onValueChange={() => {}} />)
    await user.click(screen.getByRole('button'))
    await user.keyboard('{End}')
    expect(screen.getByRole('option', { name: /Damson/ })).toHaveAttribute('data-active', '')
    await user.keyboard('{Home}')
    expect(screen.getByRole('option', { name: /Apple/ })).toHaveAttribute('data-active', '')
  })

  it('PageDown and PageUp move by a page and clamp at the ends', async () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      label: `Option ${i}`,
      value: String(i),
    }))
    const user = userEvent.setup()
    render(<MultiSelect options={many} value={[]} onValueChange={() => {}} />)
    await user.click(screen.getByRole('button'))
    await user.keyboard('{ArrowDown}{PageDown}')
    expect(screen.getByRole('option', { name: 'Option 10' })).toHaveAttribute('data-active', '')
    await user.keyboard('{PageUp}{PageUp}')
    expect(screen.getByRole('option', { name: 'Option 0' })).toHaveAttribute('data-active', '')
  })

  it('Enter on a selected option deselects it', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<MultiSelect options={options} value={['apple']} onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button'))
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onValueChange).toHaveBeenCalledWith([])
  })

  it('Enter does nothing while no option is active', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<MultiSelect options={options} value={[]} onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button'))
    await user.keyboard('{Enter}')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('Escape closes the panel', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} value={[]} onValueChange={() => {}} />)
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens from the trigger with ArrowDown, Enter and Space', async () => {
    const user = userEvent.setup()
    for (const key of ['{ArrowDown}', '{Enter}', '{ }']) {
      render(<MultiSelect options={options} value={[]} onValueChange={() => {}} />)
      const trigger = screen.getByRole('button')
      trigger.focus()
      await user.keyboard(key)
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
      cleanup()
    }
  })
})

describe('MultiSelect focus management', () => {
  it('moves focus into the search field on open', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} value={[]} onValueChange={() => {}} />)
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('combobox')).toHaveFocus()
  })

  it('returns focus to the trigger on Escape', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} value={[]} onValueChange={() => {}} />)
    const trigger = screen.getByRole('button')
    await user.click(trigger)
    await user.keyboard('{Escape}')
    expect(trigger).toHaveFocus()
  })

  it('focuses the listbox itself when there is no search field', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} value={[]} onValueChange={() => {}} searchable={false} />)
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toHaveFocus()
  })

  it('is keyboard-operable with the search field hidden', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <MultiSelect options={options} value={[]} onValueChange={onValueChange} searchable={false} />,
    )
    await user.click(screen.getByRole('button'))
    await user.keyboard('{ArrowDown}{ }')
    expect(onValueChange).toHaveBeenCalledWith(['apple'])
  })
})

describe('MultiSelect ARIA', () => {
  it('points aria-activedescendant at the active option', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} value={[]} onValueChange={() => {}} />)
    await user.click(screen.getByRole('button'))
    const search = screen.getByRole('combobox')
    expect(search).not.toHaveAttribute('aria-activedescendant')
    await user.keyboard('{ArrowDown}')
    expect(search.getAttribute('aria-activedescendant')).toBe(
      screen.getByRole('option', { name: /Apple/ }).id,
    )
  })

  it('puts aria-activedescendant on the element that actually holds focus', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} value={[]} onValueChange={() => {}} />)
    await user.click(screen.getByRole('button'))
    await user.keyboard('{ArrowDown}')
    // The old build set it on the trigger while focus sat in the search field, so a screen
    // reader tracked nothing.
    expect(document.activeElement).toHaveAttribute('aria-activedescendant')
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-activedescendant')
  })

  it('wires the search field as a combobox controlling the listbox', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} value={[]} onValueChange={() => {}} />)
    await user.click(screen.getByRole('button'))
    const search = screen.getByRole('combobox')
    expect(search).toHaveAttribute('aria-expanded', 'true')
    expect(search).toHaveAttribute('aria-autocomplete', 'list')
    expect(search.getAttribute('aria-controls')).toBe(screen.getByRole('listbox').id)
  })

  it('points the trigger aria-controls at the panel', () => {
    render(<MultiSelect options={options} value={[]} onValueChange={() => {}} />)
    const controls = screen.getByRole('button').getAttribute('aria-controls')
    expect(controls).toBeTruthy()
    expect(document.getElementById(controls!)).not.toBeNull()
  })

  it('keeps the listbox free of non-option children', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} value={[]} onValueChange={() => {}} loading />)
    await user.click(screen.getByRole('button'))
    const listbox = screen.getByRole('listbox')
    expect(within(listbox).queryByRole('combobox')).toBeNull()
    expect(within(listbox).queryByRole('status')).toBeNull()
  })

  it('mounts the live region before any selection is made', () => {
    render(<MultiSelect options={options} value={[]} onValueChange={() => {}} />)
    const live = screen
      .getAllByRole('status', { hidden: true })
      .find((el) => el.getAttribute('aria-live') === 'polite')
    expect(live).toBeDefined()
  })

  it('names the control from label, ariaLabel and aria-labelledby', () => {
    const { rerender } = render(
      <MultiSelect options={options} value={[]} onValueChange={() => {}} label="Fruit" />,
    )
    expect(screen.getByRole('button', { name: 'Fruit' })).toBeInTheDocument()
    rerender(
      <MultiSelect options={options} value={[]} onValueChange={() => {}} ariaLabel="Produce" />,
    )
    expect(screen.getByRole('button', { name: 'Produce' })).toBeInTheDocument()
  })

  it('merges its own hint id with an inherited aria-describedby', () => {
    render(
      <MultiSelect
        options={options}
        value={[]}
        onValueChange={() => {}}
        hint="Pick a few"
        aria-describedby="outside"
      />,
    )
    const described = screen.getByRole('button').getAttribute('aria-describedby')
    expect(described).toContain('outside')
    expect(described?.split(' ')).toHaveLength(2)
  })

  it('marks the listbox busy while loading', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={[]} value={[]} onValueChange={() => {}} loading />)
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Loading options…')).toBeInTheDocument()
  })

  it('activates an option from a synthesised click', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<MultiSelect options={options} value={[]} onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button'))
    screen.getByRole('option', { name: /Apple/ }).click()
    expect(onValueChange).toHaveBeenCalledWith(['apple'])
  })
})
