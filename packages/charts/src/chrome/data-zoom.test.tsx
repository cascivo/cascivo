import { describe, expect, it } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { signal } from '@cascivo/core'
import { DataZoom } from './data-zoom'
import { LineChart } from '../charts/line-chart/line-chart'

describe('DataZoom', () => {
  it('renders a draggable body, two handles, and a labelled group', () => {
    const win = signal<[number, number]>([2, 7])
    const { container } = render(<DataZoom count={10} window={win} />)
    expect(container.querySelector('[data-zoom-body]')).toBeTruthy()
    expect(container.querySelectorAll('[data-zoom-handle]').length).toBe(2)
    const group = container.querySelector('[role="group"]')!
    expect(group.getAttribute('aria-label')).toContain('3–8 of 10')
  })

  it('pans the window (both indices) when the body is arrowed', () => {
    const win = signal<[number, number]>([2, 5])
    const { container } = render(<DataZoom count={10} window={win} />)
    const body = container.querySelector('[data-zoom-body]')!
    fireEvent.keyDown(body, { key: 'ArrowRight' })
    expect(win.value).toEqual([3, 6])
  })

  it('clamps a body pan at the right edge keeping the width', () => {
    const win = signal<[number, number]>([7, 9])
    const { container } = render(<DataZoom count={10} window={win} />)
    const body = container.querySelector('[data-zoom-body]')!
    fireEvent.keyDown(body, { key: 'ArrowRight' })
    expect(win.value).toEqual([7, 9])
  })

  it('resizes (not pans) when a handle is arrowed', () => {
    const win = signal<[number, number]>([2, 7])
    const { container } = render(<DataZoom count={10} window={win} />)
    const end = container.querySelector('[data-zoom-handle="end"]')!
    fireEvent.keyDown(end, { key: 'ArrowLeft' })
    expect(win.value).toEqual([2, 6])
  })
})

describe('LineChart dataZoom + zoom integration', () => {
  const series = [
    { id: 'a', label: 'A', data: Array.from({ length: 12 }, (_, i) => ({ x: i, y: i * 2 })) },
  ]

  it('renders a DataZoom slider when dataZoom is set', () => {
    const { container } = render(
      <LineChart
        series={series}
        x={(d) => d.x}
        y={(d) => d.y}
        title="Z"
        width={400}
        height={300}
        dataZoom
      />,
    )
    expect(container.querySelector('[data-zoom-body]')).toBeTruthy()
  })

  it('keyboard "+" zooms in and reveals a reset control', () => {
    const { container, queryByText } = render(
      <LineChart
        series={series}
        x={(d) => d.x}
        y={(d) => d.y}
        title="Z"
        width={400}
        height={300}
        zoom
        tooltip
      />,
    )
    expect(queryByText('Reset zoom')).toBeNull()
    const layer = container.querySelector('[role="application"]')!
    fireEvent.keyDown(layer, { key: '+' })
    expect(queryByText('Reset zoom')).toBeTruthy()
  })
})
