import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Funnel } from './funnel'

const data = [
  { id: 'visit', label: 'Visited', value: 8200 },
  { id: 'signup', label: 'Signed up', value: 3100 },
  { id: 'active', label: 'Activated', value: 1400 },
  { id: 'paid', label: 'Paid', value: 520 },
]

describe('Funnel', () => {
  it('renders with an accessible title', () => {
    render(<Funnel data={data} title="Signup" width={400} height={320} />)
    expect(screen.getByRole('img', { name: 'Signup' })).toBeTruthy()
  })

  it('renders one trapezoid per stage', () => {
    const { container } = render(<Funnel data={data} title="Signup" width={400} height={320} />)
    expect(container.querySelectorAll('polygon').length).toBe(data.length)
  })

  it('keeps conversion percentages in the fallback table', () => {
    const { container } = render(<Funnel data={data} title="Signup" width={400} height={320} />)
    const table = container.querySelector('table')!
    // last stage 520 / first 8200 ≈ 6%
    expect(table.textContent).toContain('6%')
  })

  it('appends conversion to stage labels when showConversion is set', () => {
    const { container } = render(
      <Funnel data={data} title="Signup" width={400} height={320} showConversion />,
    )
    const labels = [...container.querySelectorAll('text[data-data-label]')].map(
      (t) => t.textContent,
    )
    expect(labels.some((l) => l?.includes('Signed up') && l.includes('%'))).toBe(true)
  })

  it('shows an empty placeholder with no data', () => {
    const { container } = render(<Funnel data={[]} title="Signup" width={400} height={320} />)
    expect(container.querySelector('[data-empty]')).toBeTruthy()
  })
})
