/**
 * The capabilities MultiSelect grew: uncontrolled mode, chips, clear-all, select-all, a max,
 * groups, creatable rows, remote search and form submission.
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

describe('uncontrolled mode', () => {
  it('owns the selection when only defaultValue is given', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} defaultValue={['apple']} />)
    expect(screen.getByText('1 selected')).toBeInTheDocument()
    await user.click(screen.getByRole('button'))
    await user.click(screen.getByRole('option', { name: /Banana/ }))
    expect(screen.getByText('2 selected')).toBeInTheDocument()
  })

  it('works with no value props at all', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} />)
    await user.click(screen.getByRole('button'))
    await user.click(screen.getByRole('option', { name: /Apple/ }))
    expect(screen.getByText('1 selected')).toBeInTheDocument()
  })

  it('still reports changes through onValueChange while uncontrolled', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<MultiSelect options={options} onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button'))
    await user.click(screen.getByRole('option', { name: /Apple/ }))
    expect(onValueChange).toHaveBeenCalledWith(['apple'])
  })

  it('lets a controlled parent refuse the change', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} value={[]} onValueChange={() => {}} />)
    await user.click(screen.getByRole('button'))
    await user.click(screen.getByRole('option', { name: /Apple/ }))
    expect(screen.getByRole('option', { name: /Apple/ })).toHaveAttribute('aria-selected', 'false')
  })
})

describe('search', () => {
  it('filters options as the user types', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} />)
    await user.click(screen.getByRole('button'))
    await user.type(screen.getByRole('combobox'), 'ban')
    expect(screen.getByRole('option', { name: /Banana/ })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Apple/ })).toBeNull()
  })

  it('matches across diacritics', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={[{ label: 'Zürich', value: 'zurich' }]} />)
    await user.click(screen.getByRole('button'))
    await user.type(screen.getByRole('combobox'), 'zur')
    expect(screen.getByRole('option', { name: /Zürich/ })).toBeInTheDocument()
  })

  it('marks the matched run in the label', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} />)
    await user.click(screen.getByRole('button'))
    await user.type(screen.getByRole('combobox'), 'app')
    const mark = within(screen.getByRole('option', { name: /Apple/ })).getByText('App')
    expect(mark.tagName).toBe('MARK')
  })

  it('shows the no-results message when nothing matches', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} />)
    await user.click(screen.getByRole('button'))
    await user.type(screen.getByRole('combobox'), 'zzz')
    expect(screen.getByText('No options found')).toBeInTheDocument()
  })

  it('reports the query for a server-driven list and honours a custom filter', async () => {
    const user = userEvent.setup()
    const onSearchChange = vi.fn()
    render(<MultiSelect options={options} onSearchChange={onSearchChange} filter={() => true} />)
    await user.click(screen.getByRole('button'))
    await user.type(screen.getByRole('combobox'), 'zzz')
    expect(onSearchChange).toHaveBeenLastCalledWith('zzz')
    // filter={() => true} leaves the server in charge, so nothing is filtered out locally.
    expect(screen.getAllByRole('option')).toHaveLength(4)
  })

  it('re-reads a changed options prop mid-search', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<MultiSelect options={options} filter={() => true} />)
    await user.click(screen.getByRole('button'))
    await user.type(screen.getByRole('combobox'), 'x')
    // The old build memoised the filtered list against signal deps only, so a parent
    // swapping options after a response kept showing the previous list.
    rerender(<MultiSelect options={[{ label: 'Elderberry', value: 'e' }]} filter={() => true} />)
    expect(screen.getByRole('option', { name: /Elderberry/ })).toBeInTheDocument()
  })
})

describe('chips', () => {
  it('renders one removable chip per selection', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} defaultValue={['apple', 'banana']} display="chips" />)
    expect(screen.getByRole('button', { name: 'Remove Apple' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove Banana' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove Apple' }))
    expect(screen.queryByRole('button', { name: 'Remove Apple' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Remove Banana' })).toBeInTheDocument()
  })

  it('keeps the trigger named while the chips are the visible summary', () => {
    render(<MultiSelect options={options} defaultValue={['apple', 'banana']} display="chips" />)
    // The trigger renders no visible text in chips mode, so its name comes from a
    // visually-hidden count — without it the button announces as unlabelled.
    expect(screen.getByRole('button', { name: '2 selected' })).toBeInTheDocument()
  })

  it('puts each chip remove control in the tab order as a real button', () => {
    render(<MultiSelect options={options} defaultValue={['apple']} display="chips" />)
    const remove = screen.getByRole('button', { name: 'Remove Apple' })
    // A role="button" span nested inside the trigger button would be neither valid HTML nor
    // focusable; the chip control is a sibling button.
    expect(remove.tagName).toBe('BUTTON')
    expect(remove.closest('button')).toBe(remove)
  })

  it('Backspace on an empty search removes the last chip', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} defaultValue={['apple', 'banana']} display="chips" />)
    await user.click(screen.getByRole('button', { name: '2 selected' }))
    await user.keyboard('{Backspace}')
    expect(screen.queryByRole('button', { name: 'Remove Banana' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Remove Apple' })).toBeInTheDocument()
  })
})

describe('clearable and selectAll', () => {
  it('clears every selection', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <MultiSelect
        options={options}
        value={['apple', 'banana']}
        onValueChange={onValueChange}
        clearable
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(onValueChange).toHaveBeenCalledWith([])
  })

  it('hides the clear control when nothing is selected', () => {
    render(<MultiSelect options={options} value={[]} onValueChange={() => {}} clearable />)
    expect(screen.queryByRole('button', { name: 'Clear selection' })).toBeNull()
  })

  it('selects every enabled option, then clears them', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} selectAll />)
    await user.click(screen.getByRole('button', { name: 'Select options' }))
    await user.click(screen.getByRole('button', { name: 'Select all' }))
    // Cherry is disabled and must stay out.
    expect(screen.getByText('3 selected')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(screen.getByText('Select options')).toBeInTheDocument()
  })
})

describe('max', () => {
  it('refuses a selection past the limit', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} max={1} />)
    await user.click(screen.getByRole('button'))
    await user.click(screen.getByRole('option', { name: /Apple/ }))
    await user.click(screen.getByRole('option', { name: /Banana/ }))
    expect(screen.getByText('1 selected')).toBeInTheDocument()
  })

  it('skips a max-blocked option with the keyboard', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} defaultValue={['apple']} max={1} />)
    await user.click(screen.getByRole('button', { name: '1 selected' }))
    await user.keyboard('{ArrowDown}')
    // Banana and Damson are blocked by the cap; only the already-selected Apple is reachable.
    expect(screen.getByRole('option', { name: /Apple/ })).toHaveAttribute('data-active', '')
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('option', { name: /Apple/ })).toHaveAttribute('data-active', '')
  })

  it('marks the unreachable options as disabled but leaves selected ones toggleable', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} defaultValue={['apple']} max={1} />)
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('option', { name: /Banana/ })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('option', { name: /Apple/ })).not.toHaveAttribute('aria-disabled')
    await user.click(screen.getByRole('option', { name: /Apple/ }))
    expect(screen.getByText('Select options')).toBeInTheDocument()
  })

  it('caps select-all at the limit', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} selectAll max={2} />)
    await user.click(screen.getByRole('button', { name: 'Select options' }))
    await user.click(screen.getByRole('button', { name: 'Select all' }))
    expect(screen.getByText('2 selected')).toBeInTheDocument()
  })
})

describe('groups', () => {
  const grouped: MultiSelectOption[] = [
    { label: 'Apple', value: 'apple', group: 'Pome' },
    { label: 'Pear', value: 'pear', group: 'Pome' },
    { label: 'Cherry', value: 'cherry', group: 'Stone' },
    { label: 'Rhubarb', value: 'rhubarb' },
  ]

  it('renders a labelled group per heading, ungrouped options first', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={grouped} />)
    await user.click(screen.getByRole('button'))
    const groups = screen.getAllByRole('group')
    expect(groups.map((g) => g.getAttribute('aria-label'))).toEqual(['Pome', 'Stone'])
    expect(within(groups[0]!).getAllByRole('option')).toHaveLength(2)
  })

  it('keeps keyboard order aligned with the rendered order', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={grouped} />)
    await user.click(screen.getByRole('button'))
    await user.keyboard('{ArrowDown}')
    // Rhubarb is ungrouped, so it renders first and is entered first.
    expect(screen.getByRole('option', { name: /Rhubarb/ })).toHaveAttribute('data-active', '')
    expect(screen.getByRole('combobox').getAttribute('aria-activedescendant')).toBe(
      screen.getByRole('option', { name: /Rhubarb/ }).id,
    )
  })
})

describe('creatable', () => {
  it('offers the typed text and reports it', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<MultiSelect options={options} creatable onCreate={onCreate} />)
    await user.click(screen.getByRole('button'))
    await user.type(screen.getByRole('combobox'), 'Elderberry')
    await user.click(screen.getByRole('option', { name: 'Add “Elderberry”' }))
    expect(onCreate).toHaveBeenCalledWith('Elderberry')
  })

  it('does not offer a label an option already has', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} creatable onCreate={() => {}} />)
    await user.click(screen.getByRole('button'))
    await user.type(screen.getByRole('combobox'), 'Apple')
    expect(screen.queryByRole('option', { name: /^Add/ })).toBeNull()
  })

  it('is reachable from the keyboard after the last option', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<MultiSelect options={options} creatable onCreate={onCreate} />)
    await user.click(screen.getByRole('button'))
    await user.type(screen.getByRole('combobox'), 'Fig')
    await user.keyboard('{End}{Enter}')
    expect(onCreate).toHaveBeenCalledWith('Fig')
  })
})

describe('form integration', () => {
  it('emits one hidden input per selected value', () => {
    const { container } = render(
      <MultiSelect options={options} defaultValue={['apple', 'banana']} name="fruit" />,
    )
    const hidden = container.querySelectorAll('input[type="hidden"][name="fruit"]')
    expect(Array.from(hidden).map((el) => (el as HTMLInputElement).value)).toEqual([
      'apple',
      'banana',
    ])
  })

  it('emits nothing without a name', () => {
    const { container } = render(<MultiSelect options={options} defaultValue={['apple']} />)
    expect(container.querySelector('input[type="hidden"]')).toBeNull()
  })
})

describe('disabled', () => {
  it('refuses to open by pointer or keyboard', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} disabled />)
    const trigger = screen.getByRole('button')
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    trigger.focus()
    await user.keyboard('{ArrowDown}')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('hides the clear control', () => {
    render(<MultiSelect options={options} defaultValue={['apple']} clearable disabled />)
    expect(screen.queryByRole('button', { name: 'Clear selection' })).toBeNull()
  })
})

describe('labels and size', () => {
  it('takes per-instance overrides, including the selected() function form', () => {
    render(
      <MultiSelect
        options={options}
        defaultValue={['apple', 'banana']}
        labels={{ selected: (n) => `${n} fruits chosen` }}
      />,
    )
    expect(screen.getByText('2 fruits chosen')).toBeInTheDocument()
  })

  it('replaces every {label} placeholder in a remove override', () => {
    render(
      <MultiSelect
        options={options}
        defaultValue={['apple']}
        display="chips"
        labels={{ remove: 'Drop {label} ({label})' }}
      />,
    )
    expect(screen.getByRole('button', { name: 'Drop Apple (Apple)' })).toBeInTheDocument()
  })

  it('applies the size attribute', () => {
    const { container, rerender } = render(<MultiSelect options={options} size="sm" />)
    expect(container.querySelector('[data-size="sm"]')).toBeInTheDocument()
    rerender(<MultiSelect options={options} size="lg" />)
    expect(container.querySelector('[data-size="lg"]')).toBeInTheDocument()
  })

  it('renders error text as an alert and suppresses the hint', () => {
    render(<MultiSelect options={options} error="Pick at least one" hint="Up to three" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Pick at least one')
    expect(screen.queryByText('Up to three')).toBeNull()
  })
})
