import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { AreaChart } from './area-chart'

/**
 * 2026-08-31 report §28 — `format` used to be widened to `number | string | Date` even when
 * the series was unambiguously a time series, so every consumer wrote the same
 * `v instanceof Date ? v : new Date(v)` guard. `x`'s return type is now threaded through.
 */
describe('AreaChart format infers from the x accessor', () => {
  it('gives format a Date parameter for a Date-valued x', () => {
    const data = [{ at: new Date(0), n: 1 }]
    render(
      <AreaChart
        title="Requests"
        series={[{ id: 'req', label: 'Requests', data }]}
        x={(d) => d.at}
        y={(d) => d.n}
        // No `instanceof` guard: `v` is a Date here, and calling a Date-only method compiles.
        format={(v) => String(v.getUTCFullYear())}
      />,
    )
    expect(document.querySelector('svg')).not.toBeNull()
  })

  it('gives format a number parameter for a numeric x', () => {
    const data = [{ t: 5, n: 1 }]
    render(
      <AreaChart
        title="Requests"
        series={[{ id: 'req', label: 'Requests', data }]}
        x={(d) => d.t}
        y={(d) => d.n}
        format={(v) => v.toFixed(1)}
      />,
    )
    expect(document.querySelector('svg')).not.toBeNull()
  })
})
