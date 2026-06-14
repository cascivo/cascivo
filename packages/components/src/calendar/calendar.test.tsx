import { afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { Calendar } from './calendar'

afterEach(cleanup)

const JUN_15 = new Date(Date.UTC(2024, 5, 15))

function dayButton(label: RegExp): HTMLElement {
  return screen.getByRole('button', { name: label })
}

describe('Calendar', () => {
  it('renders a grid with the selected month', () => {
    render(<Calendar defaultValue={JUN_15} />)
    expect(screen.getByRole('grid')).toBeInTheDocument()
    // June 2024 has 30 days
    const days = screen.getAllByRole('gridcell').filter((c) => c.querySelector('button') !== null)
    expect(days).toHaveLength(30)
  })

  it('marks the selected day', () => {
    render(<Calendar defaultValue={JUN_15} />)
    const cell = screen.getByRole('gridcell', { name: /15/ })
    expect(cell).toHaveAttribute('aria-selected', 'true')
  })

  it('only the focused date is tabbable (roving tabindex)', () => {
    render(<Calendar defaultValue={JUN_15} />)
    const tabbable = screen
      .getAllByRole('gridcell')
      .map((c) => c.querySelector('button'))
      .filter((b): b is HTMLButtonElement => b !== null && b.tabIndex === 0)
    expect(tabbable).toHaveLength(1)
    expect(tabbable[0]).toHaveTextContent('15')
  })

  it('arrow key moves the focused date by one day', () => {
    render(<Calendar defaultValue={JUN_15} />)
    const start = dayButton(/June 15/)
    start.focus()
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'ArrowRight' })
    // June 16 should now be the only tabbable day
    const focused = screen
      .getAllByRole('gridcell')
      .map((c) => c.querySelector('button'))
      .find((b) => b !== null && b.tabIndex === 0)
    expect(focused).toHaveTextContent('16')
  })

  it('arrow down moves by one week', () => {
    render(<Calendar defaultValue={JUN_15} />)
    dayButton(/June 15/).focus()
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'ArrowDown' })
    const focused = screen
      .getAllByRole('gridcell')
      .map((c) => c.querySelector('button'))
      .find((b) => b !== null && b.tabIndex === 0)
    expect(focused).toHaveTextContent('22')
  })

  it('fires onValueChange when a day is selected', () => {
    const onValueChange = vi.fn()
    render(<Calendar defaultValue={JUN_15} onValueChange={onValueChange} />)
    fireEvent.click(dayButton(/June 20/))
    expect(onValueChange).toHaveBeenCalledTimes(1)
    const arg = onValueChange.mock.calls[0]![0] as Date
    expect(arg.getUTCFullYear()).toBe(2024)
    expect(arg.getUTCMonth()).toBe(5)
    expect(arg.getUTCDate()).toBe(20)
  })

  it('skips selection of disabled days', () => {
    const onValueChange = vi.fn()
    render(
      <Calendar
        defaultValue={JUN_15}
        disabled={(d) => d.getUTCDate() === 20}
        onValueChange={onValueChange}
      />,
    )
    const disabledBtn = dayButton(/June 20/)
    expect(disabledBtn).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(disabledBtn)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('respects min/max as out-of-range', () => {
    const onValueChange = vi.fn()
    render(
      <Calendar
        defaultValue={JUN_15}
        min={new Date(Date.UTC(2024, 5, 10))}
        max={new Date(Date.UTC(2024, 5, 20))}
        onValueChange={onValueChange}
      />,
    )
    const tooEarly = dayButton(/June 5/)
    expect(tooEarly).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(tooEarly)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('navigates months with the next button', () => {
    render(<Calendar defaultValue={JUN_15} />)
    const label = screen.getByRole('grid').closest('div')!.querySelector('[aria-live="polite"]')
    const initial = label?.textContent
    fireEvent.click(screen.getByRole('button', { name: /next month/i }))
    expect(label?.textContent).not.toBe(initial)
  })

  it('marks today with aria-current', () => {
    const today = new Date()
    render(<Calendar defaultValue={today} />)
    const cell = screen
      .getAllByRole('gridcell')
      .find((c) => c.querySelector('button[aria-current="date"]'))
    expect(cell).toBeDefined()
  })
})
