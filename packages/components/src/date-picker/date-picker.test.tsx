import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DatePicker } from './date-picker'

describe('DatePicker', () => {
  it('renders trigger with placeholder', () => {
    render(<DatePicker />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Select a date')).toBeInTheDocument()
  })

  it('renders with label', () => {
    render(<DatePicker label="Appointment" />)
    expect(screen.getByText('Appointment')).toBeInTheDocument()
  })

  it('opens calendar on trigger click', () => {
    render(<DatePicker />)
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog')).toHaveAttribute('data-state', 'open')
  })

  it('closes calendar on second trigger click', () => {
    render(<DatePicker />)
    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('dialog')).toHaveAttribute('data-state', 'closed')
  })

  it('shows controlled value', () => {
    render(<DatePicker value="2024-06-15" />)
    // should display formatted date
    expect(screen.getByRole('combobox')).not.toHaveTextContent('Select a date')
  })

  it('calls onValueChange on day selection', () => {
    const onValueChange = vi.fn()
    render(<DatePicker defaultValue="2024-06-01" onValueChange={onValueChange} />)
    fireEvent.click(screen.getByRole('combobox'))
    const dayButtons = screen.getAllByRole('button').filter((b) => b.closest('td') !== null)
    fireEvent.click(dayButtons[0]!)
    expect(onValueChange).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/))
  })

  it('renders clear button when clearable and value set', () => {
    render(<DatePicker value="2024-06-15" clearable onValueChange={() => {}} />)
    expect(screen.getByRole('button', { name: /clear date/i })).toBeInTheDocument()
  })

  it('does not render clear button when not clearable', () => {
    render(<DatePicker value="2024-06-15" onValueChange={() => {}} />)
    expect(screen.queryByRole('button', { name: /clear date/i })).not.toBeInTheDocument()
  })

  it('calls onValueChange with undefined on clear', () => {
    const onValueChange = vi.fn()
    render(<DatePicker value="2024-06-15" clearable onValueChange={onValueChange} />)
    fireEvent.click(screen.getByRole('button', { name: /clear date/i }))
    expect(onValueChange).toHaveBeenCalledWith(undefined)
  })

  it('disables trigger when disabled', () => {
    render(<DatePicker disabled />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('shows error state', () => {
    render(<DatePicker error="Required" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Required')
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows hint text', () => {
    render(<DatePicker hint="Pick a future date" />)
    expect(screen.getByText('Pick a future date')).toBeInTheDocument()
  })

  it('navigates months with nav buttons', () => {
    render(<DatePicker defaultValue="2024-06-15" />)
    fireEvent.click(screen.getByRole('combobox'))
    const prevBtn = screen.getByRole('button', { name: /previous month/i })
    const monthLabel = screen.getByRole('dialog').querySelector('[aria-live="polite"]')
    const initialText = monthLabel?.textContent
    fireEvent.click(prevBtn)
    expect(monthLabel?.textContent).not.toBe(initialText)
  })

  it('applies size data attribute', () => {
    const { container } = render(<DatePicker size="lg" />)
    expect(container.firstChild).toHaveAttribute('data-size', 'lg')
  })
})
