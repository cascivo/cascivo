/**
 * The half of DatePicker that had no coverage at all: it shipped with zero keyboard tests,
 * which is how a grid whose arrow keys did nothing without a pre-existing value, a popup that
 * neither took nor returned focus, and the total absence of typed date entry all survived.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DatePicker } from './date-picker'

afterEach(cleanup)

function popupState(): string | null {
  return screen.getByRole('dialog', { hidden: true }).getAttribute('data-state')
}

describe('typed date entry', () => {
  it('accepts a date typed in the locale format', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<DatePicker onValueChange={onValueChange} />)
    const field = screen.getByRole('combobox')
    await user.type(field, '2026-03-18{Enter}')
    // The old build had no text field at all: a date already known could only be reached by
    // paging a grid, which its own manifest listed as a reason not to use it.
    expect(onValueChange).toHaveBeenCalledWith('2026-03-18')
  })

  it('does not emit while the date is still being typed', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<DatePicker onValueChange={onValueChange} />)
    await user.type(screen.getByRole('combobox'), '2026-03-1')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('commits on blur', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<DatePicker onValueChange={onValueChange} />)
    await user.type(screen.getByRole('combobox'), '2026-03-18')
    await user.tab()
    expect(onValueChange).toHaveBeenCalledWith('2026-03-18')
  })

  it('rejects an unparseable entry and reverts the field', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<DatePicker defaultValue="2026-03-18" onValueChange={onValueChange} />)
    const field = screen.getByRole('combobox') as HTMLInputElement
    const shown = field.value
    await user.clear(field)
    await user.type(field, 'nonsense{Enter}')
    expect(onValueChange).not.toHaveBeenCalled()
    expect(field.value).toBe(shown)
  })

  it('rejects a date outside the bounds', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<DatePicker min="2026-03-10" max="2026-03-20" onValueChange={onValueChange} />)
    await user.type(screen.getByRole('combobox'), '2026-04-01{Enter}')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('clears when the field is emptied', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<DatePicker defaultValue="2026-03-18" onValueChange={onValueChange} />)
    await user.clear(screen.getByRole('combobox'))
    await user.tab()
    expect(onValueChange).toHaveBeenCalledWith(undefined)
  })

  it('Escape abandons an uncommitted draft', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2026-03-18" />)
    const field = screen.getByRole('combobox') as HTMLInputElement
    const shown = field.value
    await user.clear(field)
    await user.type(field, '2026-01-01{Escape}')
    expect(field.value).toBe(shown)
  })

  it('can be turned off, leaving a button trigger', () => {
    render(<DatePicker typeable={false} />)
    expect(screen.getByRole('combobox').tagName).toBe('BUTTON')
  })
})

describe('popup focus', () => {
  it('ArrowDown opens the calendar', async () => {
    const user = userEvent.setup()
    render(<DatePicker />)
    screen.getByRole('combobox').focus()
    await user.keyboard('{ArrowDown}')
    // The combobox pattern's required key: listed in the manifest, never implemented.
    expect(popupState()).toBe('open')
  })

  it('Alt+ArrowDown opens it too', async () => {
    const user = userEvent.setup()
    render(<DatePicker />)
    screen.getByRole('combobox').focus()
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}')
    expect(popupState()).toBe('open')
  })

  it('moves focus into the grid on open', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2026-03-18" />)
    await user.click(screen.getByRole('button', { name: 'Open calendar' }))
    // The old build left focus on the trigger, so the grid was unreachable without tabbing.
    expect(document.activeElement?.getAttribute('aria-label')).toMatch(/2026/)
  })

  it('Escape closes and returns focus to the field', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2026-03-18" />)
    const field = screen.getByRole('combobox')
    await user.click(screen.getByRole('button', { name: 'Open calendar' }))
    await user.keyboard('{Escape}')
    expect(popupState()).toBe('closed')
    expect(field).toHaveFocus()
  })

  it('closes on an outside pointer press', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <DatePicker />
        <button type="button">outside</button>
      </div>,
    )
    await user.click(screen.getByRole('button', { name: 'Open calendar' }))
    expect(popupState()).toBe('open')
    await user.click(screen.getByRole('button', { name: 'outside' }))
    expect(popupState()).toBe('closed')
  })

  it('navigates the grid with no value set', async () => {
    const user = userEvent.setup()
    render(<DatePicker />)
    await user.click(screen.getByRole('button', { name: 'Open calendar' }))
    const before = document.activeElement?.getAttribute('aria-label')
    await user.keyboard('{ArrowRight}')
    // handleGridKeyDown used to open with `if (!current) return`, so with no value every
    // arrow key did nothing at all.
    expect(document.activeElement?.getAttribute('aria-label')).not.toBe(before)
  })

  it('picking a day closes the popup and reports the value', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<DatePicker defaultValue="2026-03-18" onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button', { name: 'Open calendar' }))
    await user.keyboard('{ArrowRight}{Enter}')
    expect(onValueChange).toHaveBeenCalledWith('2026-03-19')
    expect(popupState()).toBe('closed')
  })
})

describe('composition with Calendar', () => {
  it('inherits the bounded navigation', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2026-03-10" min="2026-03-10" max="2026-03-20" />)
    await user.click(screen.getByRole('button', { name: 'Open calendar' }))
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled()
  })

  it('passes a disabledDate predicate through', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <DatePicker
        defaultValue="2026-03-18"
        disabledDate={(d) => d.getUTCDate() === 19}
        onValueChange={onValueChange}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Open calendar' }))
    await user.keyboard('{ArrowRight}{Enter}')
    // Calendar skips the disabled day, so this lands on the 20th rather than doing nothing.
    expect(onValueChange).toHaveBeenCalledWith('2026-03-20')
  })

  it('offers the Today button on request', async () => {
    const user = userEvent.setup()
    render(<DatePicker showToday />)
    await user.click(screen.getByRole('button', { name: 'Open calendar' }))
    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument()
  })

  it('renders one grid, not a second hand-rolled copy', async () => {
    const user = userEvent.setup()
    render(<DatePicker />)
    await user.click(screen.getByRole('button', { name: 'Open calendar' }))
    expect(screen.getAllByRole('grid')).toHaveLength(1)
  })
})

describe('form and clearing', () => {
  it('emits a hidden input carrying the ISO value', () => {
    const { container } = render(<DatePicker defaultValue="2026-03-18" name="due" />)
    expect(container.querySelector('input[type="hidden"][name="due"]')).toHaveValue('2026-03-18')
  })

  it('reports required to assistive technology', () => {
    render(<DatePicker required />)
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-required', 'true')
  })

  it('clears and returns focus to the field', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<DatePicker defaultValue="2026-03-18" clearable onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button', { name: 'Clear date' }))
    expect(onValueChange).toHaveBeenCalledWith(undefined)
    expect(screen.getByRole('combobox')).toHaveFocus()
  })

  it('clears from the keyboard on the button variant', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <DatePicker
        defaultValue="2026-03-18"
        typeable={false}
        clearable
        onValueChange={onValueChange}
      />,
    )
    screen.getByRole('combobox').focus()
    await user.keyboard('{Delete}')
    expect(onValueChange).toHaveBeenCalledWith(undefined)
  })

  it('hides the clear control when disabled or empty', () => {
    const { rerender } = render(<DatePicker clearable />)
    expect(screen.queryByRole('button', { name: 'Clear date' })).toBeNull()
    rerender(<DatePicker clearable defaultValue="2026-03-18" disabled />)
    expect(screen.queryByRole('button', { name: 'Clear date' })).toBeNull()
  })

  it('merges its own hint id with an inherited aria-describedby', () => {
    render(<DatePicker hint="Pick a day" aria-describedby="outside" />)
    const described = screen.getByRole('combobox').getAttribute('aria-describedby')
    expect(described).toContain('outside')
    expect(described?.split(' ')).toHaveLength(2)
  })
})
