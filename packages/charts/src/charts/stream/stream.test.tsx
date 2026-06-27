import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Stream } from './stream'

const series = [
  { id: 'a', label: 'A', values: [4, 6, 5, 8, 7] },
  { id: 'b', label: 'B', values: [2, 3, 7, 4, 6] },
  { id: 'c', label: 'C', values: [5, 2, 3, 6, 4] },
]
const categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May']

describe('Stream', () => {
  it('renders with an accessible title', () => {
    render(
      <Stream series={series} categories={categories} title="Topics" width={400} height={300} />,
    )
    expect(screen.getByRole('img', { name: 'Topics' })).toBeTruthy()
  })
  it('renders one band per series', () => {
    const { container } = render(
      <Stream series={series} categories={categories} title="T" width={400} height={300} />,
    )
    expect(container.querySelectorAll('path[data-series]').length).toBe(3)
  })
  it('renders the fallback table and an empty placeholder', () => {
    const { container } = render(
      <Stream series={series} categories={categories} title="T" width={400} height={300} />,
    )
    expect(container.querySelector('table')).toBeTruthy()
    const empty = render(<Stream series={[]} categories={[]} title="E" width={400} height={300} />)
    expect(empty.container.querySelector('[data-empty]')).toBeTruthy()
  })
})
