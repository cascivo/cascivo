import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { BarChart } from './bar-chart/bar-chart'

const series = [
  {
    id: 'a',
    label: 'A',
    data: [
      { x: 'Q1', y: 10 },
      { x: 'Q2', y: 40 },
    ],
  },
]

describe('chart onSelect', () => {
  it('fires onSelect with the focused point on Enter', () => {
    const onSelect = vi.fn()
    const { container } = render(
      <BarChart
        series={series}
        x={(d) => d.x}
        y={(d) => d.y}
        title="Rev"
        width={400}
        height={300}
        tooltip
        onSelect={onSelect}
      />,
    )
    const layer = container.querySelector('[role="application"]')!
    fireEvent.focus(layer) // focuses the first point
    fireEvent.keyDown(layer, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect.mock.calls[0][0]).toMatchObject({ label: 'Q1', value: 10 })
  })

  it('marks the interactive layer with a pointer cursor when selectable', () => {
    const { container } = render(
      <BarChart
        series={series}
        x={(d) => d.x}
        y={(d) => d.y}
        title="Rev"
        width={400}
        height={300}
        tooltip
        onSelect={() => {}}
      />,
    )
    const layer = container.querySelector('[role="application"]') as HTMLElement
    expect(layer.style.cursor).toBe('pointer')
  })
})
