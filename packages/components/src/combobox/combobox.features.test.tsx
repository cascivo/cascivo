/**
 * The capabilities Combobox grew: grouping, match highlighting, remote search, creatable
 * rows, form submission, controlled open state and a clear control that leaves the component
 * in a sane state.
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

describe('controlled and uncontrolled value', () => {
  it('owns the selection when only defaultValue is given', async () => {
    const user = userEvent.setup()
    render(<Combobox options={options} defaultValue="de" />)
    expect(screen.getByRole('combobox')).toHaveValue('Germany')
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'France' }))
    expect(screen.getByRole('combobox')).toHaveValue('France')
  })

  it('lets a controlled parent refuse the change', async () => {
    const user = userEvent.setup()
    render(<Combobox options={options} value="de" onValueChange={() => {}} />)
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'France' }))
    expect(screen.getByRole('combobox')).toHaveValue('Germany')
  })

  it('shows the typed query while open and the selected label while closed', async () => {
    const user = userEvent.setup()
    render(<Combobox options={options} defaultValue="de" />)
    const field = screen.getByRole('combobox')
    expect(field).toHaveValue('Germany')
    await user.type(field, 'fra')
    expect(field).toHaveValue('fra')
    await user.keyboard('{Escape}')
    expect(field).toHaveValue('Germany')
  })
})

describe('search', () => {
  it('matches across diacritics', async () => {
    const user = userEvent.setup()
    render(<Combobox options={[{ value: 'z', label: 'Zürich' }]} />)
    await user.type(screen.getByRole('combobox'), 'zur')
    expect(screen.getByRole('option', { name: 'Zürich' })).toBeInTheDocument()
  })

  it('marks the matched run in the label', async () => {
    const user = userEvent.setup()
    render(<Combobox options={options} />)
    await user.type(screen.getByRole('combobox'), 'ger')
    const mark = within(screen.getByRole('option', { name: 'Germany' })).getByText('Ger')
    expect(mark.tagName).toBe('MARK')
  })

  it('reports the query for a server-driven list and honours a custom filter', async () => {
    const user = userEvent.setup()
    const onSearchChange = vi.fn()
    render(<Combobox options={options} onSearchChange={onSearchChange} filter={() => true} />)
    await user.type(screen.getByRole('combobox'), 'zzz')
    expect(onSearchChange).toHaveBeenLastCalledWith('zzz')
    expect(screen.getAllByRole('option')).toHaveLength(4)
  })

  it('re-reads a changed options prop mid-search', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Combobox options={options} filter={() => true} />)
    await user.type(screen.getByRole('combobox'), 'x')
    rerender(<Combobox options={[{ value: 'nz', label: 'New Zealand' }]} filter={() => true} />)
    expect(screen.getByRole('option', { name: 'New Zealand' })).toBeInTheDocument()
  })

  it('typing opens the list', async () => {
    const user = userEvent.setup()
    render(<Combobox options={options} />)
    expect(popupState()).toBe('closed')
    await user.type(screen.getByRole('combobox'), 'g')
    expect(popupState()).toBe('open')
  })
})

describe('groups', () => {
  const grouped: ComboboxOption[] = [
    { value: 'de', label: 'Germany', group: 'Europe' },
    { value: 'fr', label: 'France', group: 'Europe' },
    { value: 'jp', label: 'Japan', group: 'Asia' },
    { value: 'other', label: 'Elsewhere' },
  ]

  it('renders a labelled group per heading, ungrouped options first', async () => {
    const user = userEvent.setup()
    render(<Combobox options={grouped} />)
    await user.click(screen.getByRole('combobox'))
    const groups = screen.getAllByRole('group')
    expect(groups.map((g) => g.getAttribute('aria-label'))).toEqual(['Europe', 'Asia'])
    expect(within(groups[0]!).getAllByRole('option')).toHaveLength(2)
  })

  it('keeps keyboard order aligned with the rendered order', async () => {
    const user = userEvent.setup()
    render(<Combobox options={grouped} />)
    const field = screen.getByRole('combobox')
    await user.click(field)
    // Elsewhere is ungrouped, so it renders first and is entered first.
    expect(field.getAttribute('aria-activedescendant')).toBe(
      screen.getByRole('option', { name: 'Elsewhere' }).id,
    )
  })
})

describe('creatable', () => {
  it('offers the typed text and reports it', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<Combobox options={options} creatable onCreate={onCreate} />)
    await user.type(screen.getByRole('combobox'), 'Atlantis')
    await user.click(screen.getByRole('option', { name: 'Add “Atlantis”' }))
    expect(onCreate).toHaveBeenCalledWith('Atlantis')
    expect(popupState()).toBe('closed')
  })

  it('does not offer a label an option already has', async () => {
    const user = userEvent.setup()
    render(<Combobox options={options} creatable onCreate={() => {}} />)
    await user.type(screen.getByRole('combobox'), 'Germany')
    expect(screen.queryByRole('option', { name: /^Add/ })).toBeNull()
  })

  it('is active as soon as nothing else matches, so Enter completes the label', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<Combobox options={options} creatable onCreate={onCreate} />)
    // "Atlantis" matches no option, so the create row is the only thing to land on.
    await user.type(screen.getByRole('combobox'), 'Atlantis')
    await user.keyboard('{Enter}')
    expect(onCreate).toHaveBeenCalledWith('Atlantis')
  })

  it('is reachable from the keyboard after the last option', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<Combobox options={options} creatable onCreate={onCreate} />)
    await user.type(screen.getByRole('combobox'), 'Atlantis')
    await user.keyboard('{ArrowUp}{Enter}')
    expect(onCreate).toHaveBeenCalledWith('Atlantis')
  })
})

describe('clear', () => {
  it('resets the value, the query and focus', async () => {
    const user = userEvent.setup()
    render(<Combobox options={options} defaultValue="de" clearable />)
    const field = screen.getByRole('combobox')
    await user.click(screen.getByRole('button', { name: 'Clear selection' }))
    // The old build left the query stale and focus on a button it had just unmounted.
    expect(field).toHaveValue('')
    expect(field).toHaveFocus()
  })

  it('hides the clear control when nothing is selected or when disabled', () => {
    const { rerender } = render(<Combobox options={options} clearable />)
    expect(screen.queryByRole('button', { name: 'Clear selection' })).toBeNull()
    rerender(<Combobox options={options} clearable defaultValue="de" disabled />)
    expect(screen.queryByRole('button', { name: 'Clear selection' })).toBeNull()
  })
})

describe('controlled open state', () => {
  it('respects defaultOpen and reports changes', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Combobox options={options} defaultOpen onOpenChange={onOpenChange} />)
    expect(popupState()).toBe('open')
    await user.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it('lets a controlled parent pin the list open', async () => {
    const user = userEvent.setup()
    render(<Combobox options={options} open onOpenChange={() => {}} />)
    await user.keyboard('{Escape}')
    expect(popupState()).toBe('open')
  })
})

describe('form integration', () => {
  it('emits a hidden input carrying the selected value', () => {
    const { container } = render(<Combobox options={options} defaultValue="de" name="country" />)
    const hidden = container.querySelector('input[type="hidden"][name="country"]')
    expect(hidden).toHaveValue('de')
  })

  it('emits an empty hidden input when nothing is selected', () => {
    const { container } = render(<Combobox options={options} name="country" />)
    expect(container.querySelector('input[type="hidden"][name="country"]')).toHaveValue('')
  })

  it('emits nothing without a name', () => {
    const { container } = render(<Combobox options={options} defaultValue="de" />)
    expect(container.querySelector('input[type="hidden"]')).toBeNull()
  })
})

describe('labels', () => {
  it('takes per-instance overrides', async () => {
    const user = userEvent.setup()
    render(
      <Combobox options={[]} labels={{ placeholder: 'Pick a country', empty: 'Nothing here' }} />,
    )
    expect(screen.getByRole('combobox')).toHaveAttribute('placeholder', 'Pick a country')
    await user.click(screen.getByRole('combobox'))
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })

  it('replaces every {label} placeholder in a create override', async () => {
    const user = userEvent.setup()
    render(
      <Combobox
        options={options}
        creatable
        onCreate={() => {}}
        labels={{ create: 'New: {label} ({label})' }}
      />,
    )
    await user.type(screen.getByRole('combobox'), 'Atlantis')
    expect(screen.getByRole('option', { name: 'New: Atlantis (Atlantis)' })).toBeInTheDocument()
  })
})
