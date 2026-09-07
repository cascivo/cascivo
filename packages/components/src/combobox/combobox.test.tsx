import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createLocale } from '@cascivo/i18n'
import { Combobox } from './combobox'
import type { ComboboxOption } from './option-list'

afterEach(cleanup)

const options: ComboboxOption[] = [
  { value: 'us', label: 'United States' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan', disabled: true },
]

/** The popup, not the listbox, carries the open/closed state — a listbox may own only options. */
function popupState(): string | null {
  return (
    document.querySelector('[role="listbox"]')?.parentElement?.getAttribute('data-state') ?? null
  )
}

describe('Combobox', () => {
  it('renders with label and shows placeholder', () => {
    render(<Combobox label="Country" options={options} />)
    const field = screen.getByRole('combobox', { name: 'Country' })
    expect(field).toHaveAttribute('placeholder', 'Select an option')
  })

  it('opens listbox on click and shows options', async () => {
    const user = userEvent.setup()
    render(<Combobox label="Country" options={options} />)
    await user.click(screen.getByRole('combobox'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'United States' })).toBeInTheDocument()
  })

  it('selects an option and closes the listbox', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Combobox label="Country" options={options} onValueChange={onValueChange} />)
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Germany' }))
    expect(onValueChange).toHaveBeenCalledWith('de')
    expect(popupState()).toBe('closed')
  })

  it('filters options as the user types in the field', async () => {
    const user = userEvent.setup()
    render(<Combobox label="Country" options={options} />)
    await user.type(screen.getByRole('combobox'), 'ger')
    expect(screen.getByRole('option', { name: 'Germany' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'United States' })).not.toBeInTheDocument()
  })

  it('keyboard: ArrowDown/Enter selects active option', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Combobox label="Country" options={options} onValueChange={onValueChange} />)
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onValueChange).toHaveBeenCalledWith('de')
  })

  it('Escape closes the listbox', async () => {
    const user = userEvent.setup()
    render(<Combobox label="Country" options={options} />)
    await user.click(screen.getByRole('combobox'))
    expect(popupState()).toBe('open')
    await user.keyboard('{Escape}')
    expect(popupState()).toBe('closed')
  })

  it('shows empty state when no options match', async () => {
    const user = userEvent.setup()
    render(<Combobox label="Country" options={options} />)
    await user.type(screen.getByRole('combobox'), 'zzz')
    expect(screen.getByText('No options found')).toBeInTheDocument()
  })

  it('clearable: shows clear button and clears selection', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <Combobox
        label="Country"
        options={options}
        value="de"
        clearable
        onValueChange={onValueChange}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(onValueChange).toHaveBeenCalledWith(undefined)
  })

  it('disabled prop prevents opening', async () => {
    const user = userEvent.setup()
    render(<Combobox label="Country" options={options} disabled />)
    await user.click(screen.getByRole('combobox'))
    expect(popupState()).toBe('closed')
  })

  it('renders error and hint text', () => {
    render(<Combobox label="Country" options={options} error="Required" hint="Pick one" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Required')
    expect(screen.queryByText('Pick one')).not.toBeInTheDocument()
  })

  it('size attributes: sm, md, lg applied', () => {
    const { rerender } = render(<Combobox label="Country" options={options} size="sm" />)
    expect(document.querySelector('[data-size="sm"]')).toBeInTheDocument()
    rerender(<Combobox label="Country" options={options} size="lg" />)
    expect(document.querySelector('[data-size="lg"]')).toBeInTheDocument()
  })

  it('locale: de placeholder after store.set("de")', async () => {
    const store = createLocale({ default: 'en', supported: ['en', 'de'] })
    await store.set('de')
    render(<Combobox label="Country" options={options} />)
    expect(screen.getByRole('combobox')).toHaveAttribute('placeholder', 'Option auswählen')
    await store.set('en')
  })
})
