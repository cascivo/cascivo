import { render, screen, fireEvent } from '@testing-library/react'
import { signal } from '@preact/signals-react'
import { describe, it, expect } from 'vitest'
import { Legend } from './legend'

const series = [
  { id: 'a', label: 'Series A', color: 'red' },
  { id: 'b', label: 'Series B', color: 'blue' },
]

describe('Legend', () => {
  it('renders series labels', () => {
    const hidden = signal(new Set<string>())
    render(<Legend series={series} hidden={hidden} />)
    expect(screen.getByText('Series A')).toBeInTheDocument()
    expect(screen.getByText('Series B')).toBeInTheDocument()
  })

  it('toggle adds to hidden set', () => {
    const hidden = signal(new Set<string>())
    render(<Legend series={series} hidden={hidden} />)
    const btn = screen.getAllByRole('button')[0]!
    fireEvent.click(btn)
    expect(hidden.value.has('a')).toBe(true)
    expect(btn).toHaveAttribute('aria-pressed', 'false')
  })

  it('toggle removes from hidden set', () => {
    const hidden = signal(new Set(['a']))
    render(<Legend series={series} hidden={hidden} />)
    fireEvent.click(screen.getAllByRole('button')[0]!)
    expect(hidden.value.has('a')).toBe(false)
  })
})
