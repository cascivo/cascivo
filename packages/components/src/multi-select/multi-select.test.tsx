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
      <MultiSelect
        options={options}
        value={[]}
        onValueChange={() => {}}
        placeholder="Pick fruit"
      />,
    )
    expect(screen.getByText('Pick fruit')).toBeTruthy()
  })

  it('shows count when values selected', () => {
    render(<MultiSelect options={options} value={['apple', 'banana']} onValueChange={() => {}} />)
    expect(screen.getByText('2 selected')).toBeTruthy()
  })

  it('trigger button has aria-haspopup=listbox', () => {
    render(<MultiSelect options={options} value={[]} onValueChange={() => {}} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-haspopup', 'listbox')
  })

  it('trigger button has aria-expanded=false initially', () => {
    render(<MultiSelect options={options} value={[]} onValueChange={() => {}} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
  })

  it('trigger button has aria-expanded=true after click', async () => {
    render(<MultiSelect options={options} value={[]} onValueChange={() => {}} />)
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
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

  it('renders option items in the panel', () => {
    const { container } = render(
      <MultiSelect options={options} value={[]} onValueChange={() => {}} />,
    )
    const optionEls = container.querySelectorAll('[role="option"]')
    expect(optionEls).toHaveLength(3)
  })

  it('disabled option has aria-disabled=true', () => {
    const { container } = render(
      <MultiSelect options={options} value={[]} onValueChange={() => {}} />,
    )
    const cherryOption = Array.from(container.querySelectorAll('[role="option"]')).find((el) =>
      el.textContent?.includes('Cherry'),
    )
    expect(cherryOption).toHaveAttribute('aria-disabled', 'true')
  })

  it('selected option has data-selected attribute', () => {
    const { container } = render(
      <MultiSelect options={options} value={['apple']} onValueChange={() => {}} />,
    )
    const appleOption = Array.from(container.querySelectorAll('[role="option"]')).find((el) =>
      el.textContent?.includes('Apple'),
    )
    expect(appleOption).toHaveAttribute('data-selected')
  })

  it('panel has role=listbox', () => {
    const { container } = render(
      <MultiSelect options={options} value={[]} onValueChange={() => {}} />,
    )
    expect(container.querySelector('[role="listbox"]')).toBeTruthy()
  })
})
