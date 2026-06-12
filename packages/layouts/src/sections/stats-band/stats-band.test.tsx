import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatsBand } from './stats-band'

const stats = [
  { label: 'p99 latency', value: '184 ms', delta: '-12 ms', trend: [210, 205, 198, 184] },
  { label: 'Error rate', value: '0.12%' },
]

describe('StatsBand', () => {
  it('renders stat values', () => {
    const { getByText } = render(<StatsBand stats={stats} />)
    expect(getByText('184 ms')).toBeInTheDocument()
    expect(getByText('0.12%')).toBeInTheDocument()
  })

  it('renders labels', () => {
    const { getByText } = render(<StatsBand stats={stats} />)
    expect(getByText('p99 latency')).toBeInTheDocument()
    expect(getByText('Error rate')).toBeInTheDocument()
  })

  it('renders delta when provided', () => {
    const { getByText } = render(<StatsBand stats={stats} />)
    expect(getByText('-12 ms')).toBeInTheDocument()
  })

  it('renders sparkline when trend is provided', () => {
    const { container } = render(<StatsBand stats={stats} />)
    const svgs = container.querySelectorAll('svg[role="img"]')
    expect(svgs.length).toBe(1)
  })

  it('does not render sparkline when trend is absent', () => {
    const { container } = render(<StatsBand stats={[{ label: 'X', value: '1' }]} />)
    const svgs = container.querySelectorAll('svg[role="img"]')
    expect(svgs.length).toBe(0)
  })

  it('renders a <section> element', () => {
    const { container } = render(<StatsBand stats={[]} />)
    expect(container.querySelector('section')).not.toBeNull()
  })
})
