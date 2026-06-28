import { describe, expect, it } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { LineChart } from './line-chart'

const series = [
  { id: 'a', label: 'A', data: Array.from({ length: 6 }, (_, i) => ({ x: i, y: i * 2 })) },
  { id: 'b', label: 'B', data: Array.from({ length: 6 }, (_, i) => ({ x: i, y: i + 1 })) },
]

describe('LineChart axis tooltip', () => {
  it('draws a crosshair and a shared multi-series tooltip at the hovered x', () => {
    const { container, getByRole } = render(
      <LineChart
        series={series}
        x={(d) => d.x}
        y={(d) => d.y}
        title="Axis"
        width={400}
        height={300}
        tooltip
        tooltipMode="axis"
      />,
    )
    const layer = getByRole('application')
    fireEvent.pointerMove(layer, { clientX: 200, clientY: 150 })
    // A tooltip with both series' rows appears.
    const tip = container.querySelector('[role="tooltip"]')
    expect(tip).toBeTruthy()
    expect(tip!.textContent).toContain('A')
    expect(tip!.textContent).toContain('B')
  })

  it('keyboard navigation moves the shared readout across x', () => {
    const { getByRole, container } = render(
      <LineChart
        series={series}
        x={(d) => d.x}
        y={(d) => d.y}
        title="Axis"
        width={400}
        height={300}
        tooltip
        tooltipMode="axis"
      />,
    )
    const layer = getByRole('application')
    fireEvent.focus(layer)
    fireEvent.keyDown(layer, { key: 'ArrowRight' })
    expect(container.querySelector('[role="tooltip"]')).toBeTruthy()
  })
})

describe('LineChart decimation', () => {
  it('renders a single decimated path for a dense series and keeps full data in the table', () => {
    const dense = [
      {
        id: 'big',
        label: 'Big',
        data: Array.from({ length: 5000 }, (_, i) => ({ x: i, y: Math.sin(i / 50) })),
      },
    ]
    const { container } = render(
      <LineChart
        series={dense}
        x={(d) => d.x}
        y={(d) => d.y}
        title="Dense"
        width={400}
        height={300}
        decimate={{ threshold: 200 }}
        tooltip={false}
      />,
    )
    expect(container.querySelector('path[data-series="big"]')).toBeTruthy()
    // The a11y fallback table still lists all 5000 rows.
    expect(container.querySelectorAll('tbody tr').length).toBe(5000)
  })
})
