import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiSelect } from './multi-select'

const options = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry', disabled: true },
]

describe('MultiSelect', () => {
  it('renders trigger button', () => {
    render(<MultiSelect options={options} value={[]} onValueChange={() => {}} />)
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('shows placeholder when no value selected', () => {
    render(
      <MultiSelect options={options} value={[]} onValueChange={() => {}} placeholder="Pick fruit" />,
    )
    expect(screen.getByText('Pick fruit')).toBeTruthy()
  })

  it('shows count when values selected', () => {
    render(<MultiSelect options={options} value={['apple', 'banana']} onValueChange={() => {}} />)
    expect(screen.getByText('2 selected')).toBeTruthy()
  })

  it('opens listbox on trigger click', async () => {
    render(<MultiSelect options={options} value={[]} onValueChange={() => {}} />)
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeTruthy()
  })

  it('calls onValueChange when option clicked', async () => {
    const handler = vi.fn()
    render(<MultiSelect options={options} value={[]} onValueChange={handler} />)
    await userEvent.click(screen.getByRole('button'))
    await userEvent.click(screen.getByText('Apple'))
    expect(handler).toHaveBeenCalledWith(['apple'])
  })

  it('removes value when selected option clicked', async () => {
    const handler = vi.fn()
    render(<MultiSelect options={options} value={['apple']} onValueChange={handler} />)
    await userEvent.click(screen.getByRole('button'))
    await userEvent.click(screen.getByText('Apple'))
    expect(handler).toHaveBeenCalledWith([])
  })

  it('is disabled when disabled prop set', () => {
    render(<MultiSelect options={options} value={[]} onValueChange={() => {}} disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('options with aria-selected true for selected values', async () => {
    render(<MultiSelect options={options} value={['apple']} onValueChange={() => {}} />)
    await userEvent.click(screen.getByRole('button'))
    const appleOption = screen
      .getAllByRole('option')
      .find((el) => el.textContent?.includes('Apple'))
    expect(appleOption).toHaveAttribute('aria-selected', 'true')
  })
})
