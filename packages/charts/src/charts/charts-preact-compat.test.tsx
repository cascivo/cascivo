/**
 * Chart analogue of the Preact-compat bridge verification the lifosy feedback
 * asks for. The docs app renders cascivo under `preact/compat` (react /
 * react-dom aliased to preact/compat; signals-react resolves its own `react`
 * through the same alias). This file runs in the dedicated "preact" vitest
 * project (see vite.config.ts) where that alias is applied at resolve level —
 * so PieChart + BarChart mount on real Preact here. Charts already call
 * `useSignals()` first, so this confirms they mount and reflect signal state
 * under the bridge.
 *
 * Deterministic: no timers, no async; uses preact/compat's `render` directly.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render } from 'react-dom'
import { PieChart } from './pie-chart/pie-chart'
import { BarChart } from './bar-chart/bar-chart'

const pieData = [
  { id: 'a', label: 'Alpha', value: 60 },
  { id: 'b', label: 'Beta', value: 40 },
]

const barSeries = [
  {
    id: 's',
    label: 'Sales',
    data: [
      { x: 'Jan', y: 10 },
      { x: 'Feb', y: 20 },
    ],
  },
]
const x = (d: { x: string; y: number }) => d.x
const y = (d: { x: string; y: number }) => d.y

describe('charts under the preact/compat bridge', () => {
  let host: HTMLDivElement | undefined

  afterEach(() => {
    if (host) {
      render(null, host)
      host.remove()
      host = undefined
    }
  })

  function mount(node: Parameters<typeof render>[0]) {
    host = document.createElement('div')
    document.body.appendChild(host)
    render(node, host)
    return host
  }

  it('mounts PieChart and renders its slices + legend', () => {
    const el = mount(<PieChart data={pieData} title="Pie" />)
    expect(el.querySelector('svg[role="img"]')).toBeTruthy()
    expect(el.querySelectorAll('path[data-series]').length).toBe(2)
    // Legend buttons reflect the `hidden` signal's initial (all-visible) state.
    expect(el.querySelectorAll('button[aria-pressed="true"]').length).toBe(2)
  })

  it('mounts a donut with center content under the bridge', () => {
    const el = mount(
      <PieChart
        data={pieData}
        title="Donut"
        donut
        size={200}
        centerValue="100"
        centerLabel="Total"
      />,
    )
    expect(el.textContent).toContain('100')
    expect(el.textContent).toContain('Total')
  })

  it('mounts BarChart and renders its bars', () => {
    const el = mount(<BarChart series={barSeries} x={x} y={y} title="Bar" />)
    expect(el.querySelector('svg[role="img"]')).toBeTruthy()
    expect(el.querySelectorAll('rect[data-series]').length).toBe(2)
  })
})
