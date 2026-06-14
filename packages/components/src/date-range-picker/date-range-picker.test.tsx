import { afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import { DateRangePicker } from './date-range-picker'

afterEach(cleanup)

const JUN_2024 = { start: new Date(Date.UTC(2024, 5, 10)), end: new Date(Date.UTC(2024, 5, 20)) }

// June 2024 day buttons live in the left calendar (first grid).
function leftGrid(): HTMLElement {
  return screen.getAllByRole('grid')[0] as HTMLElement
}

function dayInLeft(label: RegExp): HTMLElement {
  return within(leftGrid()).getByRole('button', { name: label })
}

describe('DateRangePicker', () => {
  it('renders a trigger with placeholder', () => {
    render(<DateRangePicker />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Select a date range')).toBeInTheDocument()
  })

  it('opens the dual-calendar panel on trigger click', () => {
    render(<DateRangePicker defaultValue={JUN_2024} />)
    fireEvent.click(screen.getByRole('combobox'))
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true')
    // Two calendars are rendered.
    expect(screen.getAllByRole('grid')).toHaveLength(2)
  })

  it('shows two right-side months (M and M+1)', () => {
    render(<DateRangePicker defaultValue={JUN_2024} />)
    const labels = screen.getAllByText(/2024/).map((n) => n.textContent)
    // left = June, right = July
    expect(labels.some((l) => /June/i.test(l ?? ''))).toBe(true)
    expect(labels.some((l) => /July/i.test(l ?? ''))).toBe(true)
  })

  it('two clicks emit a sorted range (later click first)', () => {
    const onValueChange = vi.fn()
    render(<DateRangePicker defaultValue={JUN_2024} onValueChange={onValueChange} />)
    // Click June 25 first, then June 5 — result must be sorted start<=end.
    fireEvent.click(dayInLeft(/June 25/))
    expect(onValueChange).not.toHaveBeenCalled() // first click only sets pending
    fireEvent.click(dayInLeft(/June 5/))
    expect(onValueChange).toHaveBeenCalledTimes(1)
    const range = onValueChange.mock.calls[0]![0] as { start: Date; end: Date }
    expect(range.start.getUTCDate()).toBe(5)
    expect(range.end.getUTCDate()).toBe(25)
    expect(range.start.getTime()).toBeLessThan(range.end.getTime())
  })

  it('clicking the same date twice clears the range', () => {
    const onValueChange = vi.fn()
    render(<DateRangePicker defaultValue={JUN_2024} onValueChange={onValueChange} />)
    fireEvent.click(dayInLeft(/June 12/))
    fireEvent.click(dayInLeft(/June 12/))
    // Same-day-twice clears: onValueChange not called with a range, trigger shows placeholder.
    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.getByText('Select a date range')).toBeInTheDocument()
  })

  it('clear button resets the selection', () => {
    render(<DateRangePicker defaultValue={JUN_2024} />)
    // Trigger initially shows the range.
    expect(screen.queryByText('Select a date range')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /clear/i }))
    expect(screen.getByText('Select a date range')).toBeInTheDocument()
  })

  it('synced nav advances both calendars', () => {
    render(<DateRangePicker defaultValue={JUN_2024} />)
    const before = screen.getAllByText(/2024/).map((n) => n.textContent)
    fireEvent.click(screen.getByRole('button', { name: /next month/i }))
    const after = screen.getAllByText(/2024/).map((n) => n.textContent)
    // Both month labels changed (June→July, July→August).
    expect(after).not.toEqual(before)
    expect(after.some((l) => /August/i.test(l ?? ''))).toBe(true)
  })

  it('escape closes the panel', () => {
    render(<DateRangePicker defaultValue={JUN_2024} />)
    fireEvent.click(screen.getByRole('combobox'))
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' })
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false')
  })

  it('renders preset buttons and applies a preset', () => {
    const onValueChange = vi.fn()
    const presets = [{ label: 'June window', range: JUN_2024 }]
    render(<DateRangePicker presets={presets} onValueChange={onValueChange} />)
    const presetBtn = screen.getByRole('button', { name: 'June window' })
    fireEvent.click(presetBtn)
    expect(onValueChange).toHaveBeenCalledTimes(1)
    const range = onValueChange.mock.calls[0]![0] as { start: Date; end: Date }
    expect(range.start.getUTCDate()).toBe(10)
    expect(range.end.getUTCDate()).toBe(20)
  })

  it('applies the size data attribute', () => {
    const { container } = render(<DateRangePicker size="lg" />)
    expect(container.firstChild).toHaveAttribute('data-size', 'lg')
  })
})
