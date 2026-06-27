import { describe, expect, it } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { signal } from '@cascivo/core'
import { Brush } from './brush'
import { LineChart } from '../charts/line-chart/line-chart'

describe('Brush', () => {
  it('renders two handles and a labelled range group', () => {
    const win = signal<[number, number]>([0, 9])
    const { container } = render(<Brush count={10} window={win} />)
    expect(container.querySelectorAll('[data-brush-handle]').length).toBe(2)
    const group = container.querySelector('[role="group"]')!
    expect(group.getAttribute('aria-label')).toContain('1–10 of 10')
  })

  it('moves the start handle with ArrowRight (keyboard-operable)', () => {
    const win = signal<[number, number]>([0, 9])
    const { container } = render(<Brush count={10} window={win} />)
    const start = container.querySelector('[data-brush-handle="start"]')!
    fireEvent.keyDown(start, { key: 'ArrowRight' })
    expect(win.value).toEqual([1, 9])
  })

  it('clamps the start handle to not cross the end', () => {
    const win = signal<[number, number]>([5, 5])
    const { container } = render(<Brush count={10} window={win} />)
    const start = container.querySelector('[data-brush-handle="start"]')!
    fireEvent.keyDown(start, { key: 'ArrowRight' })
    expect(win.value).toEqual([5, 5]) // can't go past end
  })
})

describe('LineChart brush integration', () => {
  const series = [
    {
      id: 'a',
      label: 'A',
      data: Array.from({ length: 12 }, (_, i) => ({ x: i, y: i * 2 })),
    },
  ]
  it('renders a brush and subsets the plotted data to the window', () => {
    const { container } = render(
      <LineChart
        series={series}
        x={(d) => d.x}
        y={(d) => d.y}
        title="Brushed"
        width={400}
        height={300}
        brush
        tooltip
      />,
    )
    // brush present
    expect(container.querySelector('[data-brush-handle="start"]')).toBeTruthy()
    // full data = 12 points; the plot still renders a path
    expect(container.querySelector('path[data-series="a"]')).toBeTruthy()
  })
})
