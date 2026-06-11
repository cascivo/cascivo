import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SegmentedControl } from './segmented-control'

const options = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month', disabled: true },
]

describe('SegmentedControl', () => {
  it('renders all options as buttons', () => {
    render(<SegmentedControl options={options} value="day" onValueChange={() => {}} />)
    expect(screen.getByText('Day')).toBeTruthy()
    expect(screen.getByText('Week')).toBeTruthy()
    expect(screen.getByText('Month')).toBeTruthy()
  })

  it('has role=group', () => {
    render(<SegmentedControl options={options} value="day" onValueChange={() => {}} />)
    expect(screen.getByRole('group')).toBeTruthy()
  })

  it('selected option has aria-checked=true', () => {
    render(<SegmentedControl options={options} value="week" onValueChange={() => {}} />)
    const buttons = screen.getAllByRole('radio')
    const weekBtn = buttons.find((b) => b.textContent === 'Week')
    expect(weekBtn).toHaveAttribute('aria-checked', 'true')
  })

  it('non-selected options have aria-checked=false', () => {
    render(<SegmentedControl options={options} value="week" onValueChange={() => {}} />)
    const buttons = screen.getAllByRole('radio')
    const dayBtn = buttons.find((b) => b.textContent === 'Day')
    expect(dayBtn).toHaveAttribute('aria-checked', 'false')
  })

  it('calls onValueChange when option clicked', async () => {
    const handler = vi.fn()
    render(<SegmentedControl options={options} value="day" onValueChange={handler} />)
    await userEvent.click(screen.getByText('Week'))
    expect(handler).toHaveBeenCalledWith('week')
  })

  it('does not call onValueChange for disabled option', async () => {
    const handler = vi.fn()
    render(<SegmentedControl options={options} value="day" onValueChange={handler} />)
    await userEvent.click(screen.getByText('Month'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('disabled option has disabled attribute', () => {
    render(<SegmentedControl options={options} value="day" onValueChange={() => {}} />)
    const monthBtn = screen.getAllByRole('radio').find((b) => b.textContent === 'Month')
    expect(monthBtn).toBeDisabled()
  })

  it('renders data-size attribute', () => {
    const { container } = render(
      <SegmentedControl options={options} value="day" onValueChange={() => {}} size="lg" />,
    )
    expect(container.querySelector('[data-size="lg"]')).toBeTruthy()
  })

  it('selected option has data-selected attribute', () => {
    render(<SegmentedControl options={options} value="day" onValueChange={() => {}} />)
    const dayBtn = screen.getAllByRole('radio').find((b) => b.textContent === 'Day')
    expect(dayBtn).toHaveAttribute('data-selected')
  })

  it('is disabled when disabled prop set', () => {
    render(<SegmentedControl options={options} value="day" onValueChange={() => {}} disabled />)
    const buttons = screen.getAllByRole('radio')
    buttons.forEach((btn) => expect(btn).toBeDisabled())
  })
})
