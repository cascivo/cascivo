/**
 * Keyboard, focus and ARIA behaviour.
 *
 * Two of these fail catastrophically against the pre-fix component: `searchable={false}`
 * rendered a listbox no keyboard could operate at all (every handler was bound to a search
 * input that only existed while `searchable && isOpen`), and `aria-activedescendant` sat on
 * the trigger while focus had been moved into that search input, so a screen reader tracked
 * nothing as the arrows moved.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Combobox } from './combobox'
import type { ComboboxOption } from './option-list'

afterEach(cleanup)

const options: ComboboxOption[] = [
  { value: 'us', label: 'United States' },
  { value: 'de', label: 'Germany' },
  { value: 'jp', label: 'Japan', disabled: true },
  { value: 'fr', label: 'France' },
]

function popupState(): string | null {
  return (
    document.querySelector('[role="listbox"]')?.parentElement?.getAttribute('data-state') ?? null
  )
}

describe('select-only variant (searchable={false})', () => {
  it('is keyboard-operable at all', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Combobox options={options} searchable={false} onValueChange={onValueChange} />)
    const field = screen.getByRole('combobox')
    field.focus()
    await user.keyboard('{ArrowDown}')
    expect(popupState()).toBe('open')
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onValueChange).toHaveBeenCalledWith('de')
  })

  it('opens with Enter, Space and ArrowUp too', async () => {
    const user = userEvent.setup()
    for (const key of ['{Enter}', '{ }', '{ArrowUp}']) {
      render(<Combobox options={options} searchable={false} />)
      screen.getByRole('combobox').focus()
      await user.keyboard(key)
      expect(popupState()).toBe('open')
      cleanup()
    }
  })

  it('renders a button, not a text field', () => {
    render(<Combobox options={options} searchable={false} />)
    expect(screen.getByRole('combobox').tagName).toBe('BUTTON')
  })

  it('Escape closes and keeps focus on the field', async () => {
    const user = userEvent.setup()
    render(<Combobox options={options} searchable={false} />)
    const field = screen.getByRole('combobox')
    field.focus()
    await user.keyboard('{ArrowDown}{Escape}')
    expect(popupState()).toBe('closed')
    expect(field).toHaveFocus()
  })

  it('Home and End jump to the first and last enabled option', async () => {
    const user = userEvent.setup()
    render(<Combobox options={options} searchable={false} />)
    screen.getByRole('combobox').focus()
    await user.keyboard('{ArrowDown}{End}')
    expect(screen.getByRole('option', { name: 'France' })).toHaveAttribute('data-state', 'active')
    await user.keyboard('{Home}')
    expect(screen.getByRole('option', { name: 'United States' })).toHaveAttribute(
      'data-state',
      'active',
    )
  })

  it('type-to-select jumps to a matching option', async () => {
    const user = userEvent.setup()
    render(<Combobox options={options} searchable={false} />)
    screen.getByRole('combobox').focus()
    await user.keyboard('{ArrowDown}')
    await user.keyboard('fra')
    expect(screen.getByRole('option', { name: 'France' })).toHaveAttribute('data-state', 'active')
  })

  it('Space activates the active option rather than feeding the typeahead buffer', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Combobox options={options} searchable={false} onValueChange={onValueChange} />)
    screen.getByRole('combobox').focus()
    await user.keyboard('{ArrowDown}{ArrowDown}')
    await user.keyboard('{ }')
    expect(onValueChange).toHaveBeenCalledWith('de')
  })

  it('type-to-select picks a value while closed', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Combobox options={options} searchable={false} onValueChange={onValueChange} />)
    screen.getByRole('combobox').focus()
    await user.keyboard('ger')
    expect(onValueChange).toHaveBeenCalledWith('de')
  })
})

describe('keyboard navigation', () => {
  it('skips a disabled option', async () => {
    const user = userEvent.setup()
    render(<Combobox options={options} />)
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{ArrowDown}{ArrowDown}')
    // us -> de -> fr; Japan is disabled.
    expect(screen.getByRole('option', { name: 'France' })).toHaveAttribute('data-state', 'active')
  })

  it('wraps at both ends', async () => {
    const user = userEvent.setup()
    render(<Combobox options={options} />)
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('option', { name: 'France' })).toHaveAttribute('data-state', 'active')
  })

  it('opens onto the selected option rather than the top of the list', async () => {
    const user = userEvent.setup()
    render(<Combobox options={options} defaultValue="fr" />)
    await user.click(screen.getByRole('combobox'))
    expect(screen.getByRole('option', { name: 'France' })).toHaveAttribute('data-state', 'active')
  })

  it('never opens onto a disabled first option', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <Combobox
        options={[
          { value: 'x', label: 'Disabled first', disabled: true },
          { value: 'y', label: 'Second' },
        ]}
        onValueChange={onValueChange}
      />,
    )
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{Enter}')
    // The old build seeded activeIndex to a bare 0, so Enter silently did nothing here.
    expect(onValueChange).toHaveBeenCalledWith('y')
  })

  it('PageDown and PageUp move by a page and clamp', async () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      value: String(i),
      label: `Option ${i}`,
    }))
    const user = userEvent.setup()
    render(<Combobox options={many} />)
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{PageDown}')
    expect(screen.getByRole('option', { name: 'Option 10' })).toHaveAttribute(
      'data-state',
      'active',
    )
    await user.keyboard('{PageUp}{PageUp}')
    expect(screen.getByRole('option', { name: 'Option 0' })).toHaveAttribute('data-state', 'active')
  })

  it('Alt+ArrowDown opens without moving the active option', async () => {
    const user = userEvent.setup()
    render(<Combobox options={options} />)
    screen.getByRole('combobox').focus()
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}')
    expect(popupState()).toBe('open')
    expect(document.querySelector('[data-state="active"][role="option"]')).toBeNull()
  })

  it('Alt+ArrowUp closes and keeps the value', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Combobox options={options} defaultValue="de" onValueChange={onValueChange} />)
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{Alt>}{ArrowUp}{/Alt}')
    expect(popupState()).toBe('closed')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('Tab closes the listbox', async () => {
    const user = userEvent.setup()
    render(<Combobox options={options} />)
    await user.click(screen.getByRole('combobox'))
    await user.tab()
    expect(popupState()).toBe('closed')
  })

  it('Enter on a disabled option does nothing', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Combobox options={options} onValueChange={onValueChange} />)
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Japan' }))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('Escape returns focus to the field', async () => {
    const user = userEvent.setup()
    render(<Combobox options={options} />)
    const field = screen.getByRole('combobox')
    await user.click(field)
    await user.keyboard('{Escape}')
    expect(field).toHaveFocus()
  })
})

describe('ARIA', () => {
  it('puts aria-activedescendant on the element that actually holds focus', async () => {
    const user = userEvent.setup()
    render(<Combobox options={options} />)
    const field = screen.getByRole('combobox')
    await user.click(field)
    await user.keyboard('{ArrowDown}')
    // The old build set it on the trigger while focus sat in a separate search input, so a
    // screen reader tracked nothing.
    expect(document.activeElement).toBe(field)
    expect(field.getAttribute('aria-activedescendant')).toBe(
      screen.getByRole('option', { name: 'Germany' }).id,
    )
  })

  it('drops aria-activedescendant when the list closes', async () => {
    const user = userEvent.setup()
    render(<Combobox options={options} />)
    const field = screen.getByRole('combobox')
    await user.click(field)
    await user.keyboard('{ArrowDown}{Escape}')
    expect(field).not.toHaveAttribute('aria-activedescendant')
  })

  it('wires the field as a combobox controlling the listbox', () => {
    render(<Combobox options={options} label="Country" />)
    const field = screen.getByRole('combobox')
    expect(field).toHaveAttribute('aria-expanded', 'false')
    expect(field).toHaveAttribute('aria-autocomplete', 'list')
    expect(field.getAttribute('aria-controls')).toBe(document.querySelector('[role="listbox"]')!.id)
  })

  it('keeps the listbox free of non-option children', async () => {
    const user = userEvent.setup()
    render(<Combobox options={[]} loading />)
    await user.click(screen.getByRole('combobox'))
    const listbox = screen.getByRole('listbox')
    // The search field and the empty/loading message used to be inside role="listbox",
    // which owns only option and group children.
    expect(within(listbox).queryByRole('textbox')).toBeNull()
    expect(within(listbox).queryByRole('status')).toBeNull()
  })

  it('marks the listbox busy while loading', async () => {
    const user = userEvent.setup()
    render(<Combobox options={[]} loading />)
    await user.click(screen.getByRole('combobox'))
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Loading options…')).toBeInTheDocument()
  })

  it('names the field from label, ariaLabel and aria-labelledby', () => {
    const { rerender } = render(<Combobox options={options} label="Country" />)
    expect(screen.getByRole('combobox', { name: 'Country' })).toBeInTheDocument()
    rerender(<Combobox options={options} ariaLabel="Nation" />)
    expect(screen.getByRole('combobox', { name: 'Nation' })).toBeInTheDocument()
  })

  it('merges its own hint id with an inherited aria-describedby', () => {
    render(<Combobox options={options} hint="Pick one" aria-describedby="outside" />)
    const described = screen.getByRole('combobox').getAttribute('aria-describedby')
    expect(described).toContain('outside')
    expect(described?.split(' ')).toHaveLength(2)
  })

  it('reports required to assistive technology', () => {
    render(<Combobox options={options} required />)
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-required', 'true')
  })

  it('mounts the result-count live region before the list is opened', () => {
    render(<Combobox options={options} />)
    const live = screen
      .getAllByRole('status', { hidden: true })
      .find((el) => el.getAttribute('aria-live') === 'polite')
    expect(live).toBeDefined()
  })

  it('activates an option from a synthesised click', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Combobox options={options} onValueChange={onValueChange} />)
    await user.click(screen.getByRole('combobox'))
    screen.getByRole('option', { name: 'Germany' }).click()
    expect(onValueChange).toHaveBeenCalledWith('de')
  })
})

describe('dismissal', () => {
  it('closes on an outside pointer press', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <Combobox options={options} />
        <button type="button">outside</button>
      </div>,
    )
    await user.click(screen.getByRole('combobox'))
    expect(popupState()).toBe('open')
    await user.click(screen.getByRole('button', { name: 'outside' }))
    expect(popupState()).toBe('closed')
  })

  it('stays open when the pointer lands inside the control', async () => {
    const user = userEvent.setup()
    render(<Combobox options={options} />)
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Japan' }))
    // Japan is disabled, so the click selects nothing and must not dismiss either.
    expect(popupState()).toBe('open')
  })
})
