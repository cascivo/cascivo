import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Filter } from './filter'

const OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Archived', value: 'archived' },
]

describe('Filter', () => {
  it('renders all options as buttons', () => {
    render(<Filter options={OPTIONS} aria-label="Filter" />)
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Active' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Archived' })).toBeInTheDocument()
  })

  it('clicking an option selects it (data-selected and aria-pressed)', async () => {
    render(<Filter options={OPTIONS} aria-label="Filter" />)
    const btn = screen.getByRole('button', { name: 'Active' })
    await userEvent.click(btn)
    expect(btn).toHaveAttribute('data-selected')
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('in single-select mode: clicking selected item deselects it', async () => {
    render(<Filter options={OPTIONS} aria-label="Filter" />)
    const btn = screen.getByRole('button', { name: 'Active' })
    await userEvent.click(btn)
    expect(btn).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(btn)
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    expect(btn).not.toHaveAttribute('data-selected')
  })

  it('in single-select mode: new selection deselects previous', async () => {
    render(<Filter options={OPTIONS} aria-label="Filter" />)
    await userEvent.click(screen.getByRole('button', { name: 'Active' }))
    await userEvent.click(screen.getByRole('button', { name: 'Archived' }))
    expect(screen.getByRole('button', { name: 'Active' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Archived' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('in multi mode: multiple items can be selected', async () => {
    render(<Filter options={OPTIONS} multi aria-label="Filter" />)
    await userEvent.click(screen.getByRole('button', { name: 'Active' }))
    await userEvent.click(screen.getByRole('button', { name: 'Archived' }))
    expect(screen.getByRole('button', { name: 'Active' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Archived' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onChange with the new selected array', async () => {
    const onChange = vi.fn()
    render(<Filter options={OPTIONS} onChange={onChange} aria-label="Filter" />)
    await userEvent.click(screen.getByRole('button', { name: 'Active' }))
    expect(onChange).toHaveBeenCalledWith(['active'])
  })

  it('calls onValueChange with the new array, taking precedence over onChange', async () => {
    const onValueChange = vi.fn()
    const onChange = vi.fn()
    render(
      <Filter
        options={OPTIONS}
        onValueChange={onValueChange}
        onChange={onChange}
        aria-label="Filter"
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Active' }))
    expect(onValueChange).toHaveBeenCalledWith(['active'])
    expect(onChange).not.toHaveBeenCalled()
  })

  it('controlled: value prop drives selected state', () => {
    render(<Filter options={OPTIONS} value={['active']} aria-label="Filter" />)
    expect(screen.getByRole('button', { name: 'Active' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false')
  })
})

/**
 * `multiple` is the HTML spelling and therefore the guess. An adopter reached for it, got a
 * type error, and only then found `multi` — whose doc comment they could not have read,
 * because you cannot look up a prop you do not know exists (2026-08-22 report item 14).
 */
describe('Filter multiple alias', () => {
  const options = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
  ]

  it('accepts `multiple` as an alias of `multi`', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Filter options={options} multiple onValueChange={onValueChange} ariaLabel="F" />)
    await user.click(screen.getByRole('button', { name: 'A' }))
    await user.click(screen.getByRole('button', { name: 'B' }))
    expect(onValueChange).toHaveBeenLastCalledWith(['a', 'b'])
  })

  it('still selects one at a time when neither is set', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Filter options={options} onValueChange={onValueChange} ariaLabel="F" />)
    await user.click(screen.getByRole('button', { name: 'A' }))
    await user.click(screen.getByRole('button', { name: 'B' }))
    expect(onValueChange).toHaveBeenLastCalledWith(['b'])
  })
})
