import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NumberInput } from './number-input'

describe('NumberInput', () => {
  it('renders with label', () => {
    render(<NumberInput label="Quantity" />)
    expect(screen.getByLabelText('Quantity')).toBeInTheDocument()
  })

  it('exposes spinbutton semantics with aria value attributes', () => {
    render(<NumberInput label="Quantity" defaultValue={5} min={0} max={10} />)
    const input = screen.getByRole('spinbutton', { name: 'Quantity' })
    expect(input).toHaveAttribute('aria-valuenow', '5')
    expect(input).toHaveAttribute('aria-valuemin', '0')
    expect(input).toHaveAttribute('aria-valuemax', '10')
  })

  it('commits parsed value on blur', async () => {
    const handler = vi.fn()
    render(<NumberInput label="Quantity" onChange={handler} />)
    const input = screen.getByLabelText('Quantity')
    await userEvent.click(input)
    await userEvent.keyboard('42')
    await userEvent.tab()
    expect(handler).toHaveBeenCalledWith(42)
    expect(input).toHaveValue('42')
  })

  it('commits on Enter', async () => {
    const handler = vi.fn()
    render(<NumberInput label="Quantity" onChange={handler} />)
    await userEvent.click(screen.getByLabelText('Quantity'))
    await userEvent.keyboard('7{Enter}')
    expect(handler).toHaveBeenCalledWith(7)
  })

  it('fires onChange with null when cleared', async () => {
    const handler = vi.fn()
    render(<NumberInput label="Quantity" defaultValue={5} onChange={handler} />)
    const input = screen.getByLabelText('Quantity')
    await userEvent.clear(input)
    await userEvent.tab()
    expect(handler).toHaveBeenCalledWith(null)
    expect(input).toHaveValue('')
  })

  it('fires onChange with null for unparseable input', async () => {
    const handler = vi.fn()
    render(<NumberInput label="Quantity" defaultValue={5} onChange={handler} />)
    const input = screen.getByLabelText('Quantity')
    await userEvent.clear(input)
    await userEvent.keyboard('abc')
    await userEvent.tab()
    expect(handler).toHaveBeenCalledWith(null)
  })

  it('clamps to min and max on commit', async () => {
    const handler = vi.fn()
    render(<NumberInput label="Quantity" min={0} max={10} onChange={handler} />)
    const input = screen.getByLabelText('Quantity')
    await userEvent.click(input)
    await userEvent.keyboard('99')
    await userEvent.tab()
    expect(handler).toHaveBeenCalledWith(10)
    expect(input).toHaveValue('10')
  })

  it('rounds to precision on commit', async () => {
    const handler = vi.fn()
    render(<NumberInput label="Price" precision={2} onChange={handler} />)
    const input = screen.getByLabelText('Price')
    await userEvent.click(input)
    await userEvent.keyboard('3.14159')
    await userEvent.tab()
    expect(handler).toHaveBeenCalledWith(3.14)
  })

  it('steps with ArrowUp and ArrowDown', async () => {
    const handler = vi.fn()
    render(<NumberInput label="Quantity" defaultValue={5} onChange={handler} />)
    const input = screen.getByLabelText('Quantity')
    await userEvent.click(input)
    await userEvent.keyboard('{ArrowUp}')
    expect(handler).toHaveBeenLastCalledWith(6)
    await userEvent.keyboard('{ArrowDown}')
    expect(handler).toHaveBeenLastCalledWith(5)
  })

  it('steps via the stepper buttons', async () => {
    const handler = vi.fn()
    render(<NumberInput label="Quantity" defaultValue={5} step={2} onChange={handler} />)
    await userEvent.click(screen.getByRole('button', { name: 'Increment' }))
    expect(handler).toHaveBeenLastCalledWith(7)
    await userEvent.click(screen.getByRole('button', { name: 'Decrement' }))
    expect(handler).toHaveBeenLastCalledWith(5)
  })

  it('supports custom stepper labels', () => {
    render(<NumberInput label="Quantity" incrementLabel="More" decrementLabel="Less" />)
    expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Less' })).toBeInTheDocument()
  })

  it('disables stepper buttons at the bounds', () => {
    render(<NumberInput label="Quantity" defaultValue={10} min={0} max={10} />)
    expect(screen.getByRole('button', { name: 'Increment' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Decrement' })).toBeEnabled()
  })

  it('formats the display on blur with formatOptions and shows raw value while focused', async () => {
    const expected = new Intl.NumberFormat(undefined, { useGrouping: true }).format(1234.5)
    render(<NumberInput label="Amount" defaultValue={1234.5} formatOptions={{ useGrouping: true }} />)
    const input = screen.getByLabelText('Amount')
    expect(input).toHaveValue(expected)
    await userEvent.click(input)
    expect(input).toHaveValue('1234.5')
    await userEvent.tab()
    expect(input).toHaveValue(expected)
  })

  it('supports controlled value', () => {
    const { rerender } = render(<NumberInput label="Quantity" value={5} onChange={() => {}} />)
    expect(screen.getByLabelText('Quantity')).toHaveValue('5')
    rerender(<NumberInput label="Quantity" value={9} onChange={() => {}} />)
    expect(screen.getByLabelText('Quantity')).toHaveValue('9')
  })

  it('shows error message and sets aria-invalid', () => {
    render(<NumberInput label="Quantity" error="Required" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Required')
    expect(screen.getByLabelText('Quantity')).toHaveAttribute('aria-invalid', 'true')
  })

  it('hides hint when error is shown', () => {
    render(<NumberInput label="Quantity" hint="Hint text" error="Error text" />)
    expect(screen.queryByText('Hint text')).not.toBeInTheDocument()
  })

  it('disables input and steppers when disabled', () => {
    render(<NumberInput label="Quantity" disabled />)
    expect(screen.getByLabelText('Quantity')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Increment' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Decrement' })).toBeDisabled()
  })
})
