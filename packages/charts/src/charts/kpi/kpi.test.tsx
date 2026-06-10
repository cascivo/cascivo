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
