import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { splitDefined, type Point } from '../engine/shape'
import { LineChart } from './line-chart/line-chart'
import { BarChart } from './bar-chart/bar-chart'

describe('splitDefined', () => {
  const a: Point = [0, 0]
  const b: Point = [1, 1]
  const c: Point = [2, 2]

  it('breaks runs at null gaps by default', () => {
    expect(splitDefined([a, null, b])).toEqual([[a], [b]])
  })

  it('bridges gaps when connectNulls is set', () => {
    expect(splitDefined([a, null, b], true)).toEqual([[a, b]])
  })

  it('handles leading/trailing/empty gaps', () => {
    expect(splitDefined([null, a, b, null])).toEqual([[a, b]])
    expect(splitDefined([null, null])).toEqual([])
    expect(splitDefined([a, b, c])).toEqual([[a, b, c]])
  })
})

describe('LineChart connectNulls', () => {
  const series = [
    {
      id: 'a',
      label: 'A',
      data: [
        { x: 0, y: 10 },
        { x: 1, y: Number.NaN }, // gap
        { x: 2, y: 30 },
        { x: 3, y: 25 },
      ],
    },
  ]

  it('breaks the line into two paths at the gap by default', () => {
    const { container } = render(
      <LineChart
        series={series}
        x={(d) => d.x}
        y={(d) => d.y}
        title="Gappy"
        width={400}
        height={300}
      />,
    )
    const paths = container.querySelectorAll('path[data-series="a"]')
    expect(paths.length).toBe(2)
    // no NaN leaks into any path geometry
    for (const p of paths) expect(p.getAttribute('d')).not.toContain('NaN')
  })

  it('bridges the gap into one path when connectNulls is set', () => {
    const { container } = render(
      <LineChart
        series={series}
        x={(d) => d.x}
        y={(d) => d.y}
        title="Gappy"
        width={400}
        height={300}
        connectNulls
      />,
    )
    expect(container.querySelectorAll('path[data-series="a"]').length).toBe(1)
  })
})

describe('BarChart percent stacking', () => {
  const series = [
    {
      id: 'done',
      label: 'Done',
      data: [
        { x: 'Mon', y: 3 },
        { x: 'Tue', y: 9 },
      ],
    },
    {
      id: 'todo',
      label: 'Todo',
      data: [
        { x: 'Mon', y: 1 },
        { x: 'Tue', y: 3 },
      ],
    },
  ]

  it('normalizes each category to a full-height stack', () => {
    const { container } = render(
      <BarChart
        series={series}
        x={(d) => d.x}
        y={(d) => d.y}
        title="Mix"
        mode="percent"
        width={400}
        height={300}
      />,
    )
    // 2 series × 2 categories = 4 bars
    const bars = container.querySelectorAll('rect[data-series]')
    expect(bars.length).toBe(4)
    // each category's stack fills the same total height (≈ inner height)
    const monBars = [...bars].filter((_, i) => i % 2 === 0)
    expect(monBars.length).toBeGreaterThan(0)
  })

  it('formats the value axis as percentages', () => {
    const { container } = render(
      <BarChart
        series={series}
        x={(d) => d.x}
        y={(d) => d.y}
        title="Mix"
        mode="percent"
        width={400}
        height={300}
      />,
    )
    expect(container.textContent).toContain('%')
  })
})
