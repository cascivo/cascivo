import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Kpi } from './kpi'

describe('Kpi', () => {
  it('renders value and label', () => {
    render(<Kpi value={1234} label="Users" />)
    expect(screen.getByText('Users')).toBeTruthy()
    expect(screen.getByText('1,234')).toBeTruthy()
  })

  it('renders string value', () => {
    render(<Kpi value="$48,290" label="Revenue" />)
    expect(screen.getByText('$48,290')).toBeTruthy()
  })

  it('renders positive delta with up arrow', () => {
    const { container } = render(<Kpi value={100} label="Score" delta={12} />)
    expect(container.textContent).toContain('▲')
    expect(container.textContent).toContain('+12')
  })

  it('renders negative delta with down arrow', () => {
    const { container } = render(<Kpi value={100} label="Score" delta={-5} />)
    expect(container.textContent).toContain('▼')
    expect(container.textContent).toContain('-5')
  })

  it('renders sparkline when provided', () => {
    const { container } = render(<Kpi value={100} label="Revenue" sparkline={[1, 2, 3, 4, 5]} />)
    expect(container.querySelector('svg[role="img"]')).toBeTruthy()
  })

  it('renders icon when provided', () => {
    const { container } = render(
      <Kpi value={100} label="Score" icon={<span data-testid="icon">★</span>} />,
    )
    expect(container.querySelector('[data-testid="icon"]')).toBeTruthy()
  })
})

describe('Kpi deltaFormat', () => {
  it('defaults to a signed number (unchanged behaviour)', () => {
    render(<Kpi label="Deploys" value={128} delta={25.6} />)
    expect(screen.getByRole('img')).toHaveTextContent('+25.6')
    expect(screen.getByRole('img')).not.toHaveTextContent('%')
  })

  it('percent appends the unit without rescaling (25.6 → +25.6%)', () => {
    render(<Kpi label="Deploys" value={128} delta={25.6} deltaFormat="percent" />)
    expect(screen.getByRole('img')).toHaveTextContent('+25.6%')
  })

  it('a function formatter owns the whole string', () => {
    render(<Kpi label="Deploys" value={128} delta={25.6} deltaFormat={(d) => `${d} pts`} />)
    expect(screen.getByRole('img')).toHaveTextContent('25.6 pts')
  })

  it('keeps the down arrow and destructive tone for a negative percent delta', () => {
    render(<Kpi label="Deploys" value={128} delta={-4} deltaFormat="percent" />)
    const trend = screen.getByRole('img')
    expect(trend).toHaveTextContent('▼')
    expect(trend).toHaveTextContent('-4%')
  })

  it('colours the delta by sentiment, not by the sign of the number', () => {
    // `Errors / day 2,933 ▼ -5.4%` rendered red because negative was hard-coded as bad.
    const { container } = render(
      <Kpi label="Errors / day" value={2933} delta={-5.4} goodDirection="down" />,
    )
    const delta = container.querySelector('[data-trend]')!
    expect(delta.getAttribute('data-trend')).toBe('down')
    expect(delta.getAttribute('data-sentiment')).toBe('good')
  })

  it('defaults to up-is-good, preserving existing behaviour', () => {
    const { container } = render(<Kpi label="Revenue" value={100} delta={12} />)
    expect(container.querySelector('[data-trend]')!.getAttribute('data-sentiment')).toBe('good')
  })
})
