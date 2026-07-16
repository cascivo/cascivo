import { render, act } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'
import { PieChart } from './pie-chart/pie-chart'
import { Radar } from './radar/radar'
import { Gauge } from './gauge/gauge'
import { RadialBar } from './radial-bar/radial-bar'

/**
 * SSR-determinism guard for the trig chart family.
 *
 * Arc/polar geometry is built from `Math.sin`/`Math.cos`, which are NOT
 * bit-reproducible across JavaScript engines — the SSR runtime (Node) and the
 * browser can differ in the last floating-point digits, so an SSR-rendered `d`
 * attribute won't match the client's first render and React 19 discards the
 * server markup ("a tree hydrated but some attributes…"). `engine/shape.ts`'s
 * `quantize` rounds every emitted coordinate to 2 decimals to erase that noise.
 * Arithmetic-only charts (area/line/bar via linear/band scales) are exact on every
 * engine and legitimately carry longer decimals, so they are not covered here.
 *
 * A single-engine (jsdom) test can't reproduce cross-engine float divergence
 * directly, so the coordinate-precision assertion is the proxy that guarantees it
 * can't recur: if every emitted arc/polar coordinate is quantized at the source,
 * the two engines cannot disagree on the rounded value.
 */

const pieData = [
  { id: 'a', label: 'Alpha', value: 40 },
  { id: 'b', label: 'Beta', value: 35 },
  { id: 'c', label: 'Gamma', value: 25 },
]
const radarAxes = ['Speed', 'Power', 'Range', 'Efficiency', 'Cost']
const radarSeries = [
  { id: 'a', label: 'Model A', values: [80, 70, 60, 90, 50] },
  { id: 'b', label: 'Model B', values: [60, 85, 75, 70, 80] },
]
const radialData = [
  { id: 'rev', label: 'Revenue', value: 84 },
  { id: 'nps', label: 'NPS', value: 61 },
  { id: 'ret', label: 'Retention', value: 72 },
]

const trigCases: { name: string; el: ReactElement }[] = [
  { name: 'PieChart donut', el: <PieChart data={pieData} title="Pie" donut size={200} /> },
  { name: 'PieChart', el: <PieChart data={pieData} title="Pie" size={200} /> },
  { name: 'Radar', el: <Radar axes={radarAxes} series={radarSeries} title="Radar" /> },
  { name: 'Gauge', el: <Gauge title="G" value={57} min={0} max={100} width={240} height={240} /> },
  { name: 'RadialBar', el: <RadialBar data={radialData} title="Goals" width={300} height={300} /> },
]

/** Numeric tokens in coordinate attributes must carry at most 2 decimal places. */
function assertQuantizedCoords(html: string) {
  const values = [...html.matchAll(/(?:\bd|points)="([^"]*)"/g)].map((m) => m[1]!)
  for (const value of values) {
    for (const token of value.match(/-?\d+\.\d+/g) ?? []) {
      const decimals = token.split('.')[1]!.length
      expect(
        decimals,
        `coordinate "${token}" in "${value}" exceeds 2 decimals — unquantized trig output will break SSR hydration`,
      ).toBeLessThanOrEqual(2)
    }
  }
}

describe('chart SSR determinism', () => {
  for (const { name, el } of trigCases) {
    it(`${name}: emits only quantized arc/polar coordinates`, () => {
      // The server render is the exact string a real SSR pass emits.
      assertQuantizedCoords(renderToString(el))
    })
  }

  it('PieChart donut hydrates without a mismatch warning', () => {
    const el = <PieChart data={pieData} title="Pie" donut size={200} />
    const container = document.createElement('div')
    container.innerHTML = renderToString(el)
    document.body.appendChild(container)
    const errors: unknown[][] = []
    const spy = vi.spyOn(console, 'error').mockImplementation((...args) => {
      errors.push(args)
    })
    try {
      act(() => {
        hydrateRoot(container, el)
      })
    } finally {
      spy.mockRestore()
      container.remove()
    }
    const hydrationErrors = errors.filter((args) =>
      args.some((a) => typeof a === 'string' && /hydrat|did not match|tree hydrated/i.test(a)),
    )
    expect(hydrationErrors).toEqual([])
  })
})
