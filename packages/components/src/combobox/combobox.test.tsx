import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createLocale } from '@cascivo/i18n'
import { Combobox, type ComboboxOption } from './combobox'

const options: ComboboxOption[] = [
  { value: 'us', label: 'United States' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan', disabled: true },
]

describe('Combobox', () => {
  it('renders with label and shows placeholder', () => {
    render(<Combobox label="Country" options={options} />)
    expect(screen.getByRole('combobox', { name: 'Country' })).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveTextContent('Select an option')
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
    const onChange = vi.fn()
    render(<Combobox label="Country" options={options} onChange={onChange} />)
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Germany' }))
    expect(onChange).toHaveBeenCalledWith('de')
    expect(screen.getByRole('listbox', { hidden: true })).toHaveAttribute('data-state', 'closed')
  })

  it('calls onValueChange on selection, taking precedence over onChange', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const onChange = vi.fn()
    render(
      <Combobox
        label="Country"
        options={options}
        onValueChange={onValueChange}
        onChange={onChange}
      />,
    )
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Germany' }))
    expect(onValueChange).toHaveBeenCalledWith('de')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('filters options when typing in the search field', async () => {
    const user = userEvent.setup()
    render(<Combobox label="Country" options={options} />)
    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByRole('textbox', { name: 'Search options' }), 'ger')
    expect(screen.getByRole('option', { name: 'Germany' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'United States' })).not.toBeInTheDocument()
  })

  it('keyboard: ArrowDown/Enter selects active option', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Combobox label="Country" options={options} onChange={onChange} />)
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith(expect.any(String))
  })

  it('Escape closes the listbox', async () => {
    const user = userEvent.setup()
    render(<Combobox label="Country" options={options} />)
    await user.click(screen.getByRole('combobox'))
    screen.getByRole('textbox', { name: 'Search options' }).focus()
    await user.keyboard('{Escape}')
    expect(screen.getByRole('listbox', { hidden: true })).toHaveAttribute('data-state', 'closed')
  })

  it('shows empty state when no options match search', async () => {
    const user = userEvent.setup()
    render(<Combobox label="Country" options={options} />)
    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByRole('textbox', { name: 'Search options' }), 'zzz')
    expect(screen.getByText('No options found')).toBeInTheDocument()
  })

  it('clearable: shows clear button and clears selection', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Combobox label="Country" options={options} value="de" clearable onChange={onChange} />)
    const clearBtn = screen.getByRole('button', { name: 'Clear selection' })
    await user.click(clearBtn)
    expect(onChange).toHaveBeenCalledWith(undefined)
  })

  it('disabled prop prevents opening', async () => {
    const user = userEvent.setup()
    render(<Combobox label="Country" options={options} disabled />)
    await user.click(screen.getByRole('combobox'))
    expect(screen.getByRole('listbox', { hidden: true })).toHaveAttribute('data-state', 'closed')
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
    expect(screen.getByRole('combobox')).toHaveTextContent('Option auswählen')
    await store.set('en')
  })
})
