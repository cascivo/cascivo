import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NativeSelect } from './native-select'

afterEach(cleanup)

const options = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry', disabled: true },
]

describe('NativeSelect', () => {
  it('renders a native select with the given options', () => {
    render(<NativeSelect options={options} aria-label="Fruit" />)
    const select = screen.getByRole('combobox', { name: 'Fruit' })
    expect(select.tagName).toBe('SELECT')
    expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Cherry' })).toBeDisabled()
  })

  it('renders a disabled hidden placeholder option', () => {
    const { container } = render(
      <NativeSelect options={options} placeholder="Pick one" aria-label="Fruit" />,
    )
    const placeholder = container.querySelector<HTMLOptionElement>('option[value=""]')
    expect(placeholder).not.toBeNull()
    expect(placeholder).toHaveTextContent('Pick one')
    expect(placeholder).toBeDisabled()
    expect(placeholder).toHaveAttribute('hidden')
  })

  it('fires onChange with the chosen value', async () => {
    const onChange = vi.fn()
    render(<NativeSelect options={options} onChange={onChange} aria-label="Fruit" />)
    await userEvent.selectOptions(screen.getByRole('combobox'), 'b')
    expect(onChange).toHaveBeenCalled()
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('b')
  })

  it('supports raw option children', () => {
    render(
      <NativeSelect aria-label="Fruit">
        <option value="x">X</option>
      </NativeSelect>,
    )
    expect(screen.getByRole('option', { name: 'X' })).toBeInTheDocument()
  })

  it('sets aria-invalid when invalid', () => {
    render(<NativeSelect options={options} invalid aria-label="Fruit" />)
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
  })
})
