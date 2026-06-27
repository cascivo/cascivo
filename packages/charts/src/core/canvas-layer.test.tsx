import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { ScatterChart } from '../charts/scatter-chart/scatter-chart'

// jsdom has no canvas backend — stub a 2D context that records arc calls.
let arcCalls = 0
const ctxStub = {
  setTransform: vi.fn(),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(() => {
    arcCalls += 1
  }),
  fill: vi.fn(),
  canvas: {} as HTMLCanvasElement,
  fillStyle: '',
  globalAlpha: 1,
}

let original: typeof HTMLCanvasElement.prototype.getContext

beforeEach(() => {
  arcCalls = 0
  original = HTMLCanvasElement.prototype.getContext
  // @ts-expect-error test stub
  HTMLCanvasElement.prototype.getContext = vi.fn(function (this: HTMLCanvasElement) {
    ctxStub.canvas = this
    return ctxStub
  })
})
afterEach(() => {
  HTMLCanvasElement.prototype.getContext = original
})

const series = [
  {
    id: 'a',
    label: 'A',
    data: Array.from({ length: 50 }, (_, i) => ({ x: i, y: (i * 7) % 40 })),
  },
]

describe('Canvas renderer', () => {
  it('renders a canvas, paints the points, and drops the SVG circles', () => {
    const { container } = render(
      <ScatterChart series={series} title="Big" width={400} height={300} renderer="canvas" />,
    )
    // canvas present + aria-hidden
    const canvas = container.querySelector('canvas[data-canvas-layer]')
    expect(canvas).toBeTruthy()
    expect(canvas?.getAttribute('aria-hidden')).toBe('true')
    // points painted to canvas, not drawn as SVG circles
    expect(arcCalls).toBe(50)
    expect(container.querySelector('circle')).toBeNull()
  })

  it('keeps the full a11y tree (fallback table + keyboard layer) in canvas mode', () => {
    const { container } = render(
      <ScatterChart
        series={series}
        title="Big"
        width={400}
        height={300}
        renderer="canvas"
        tooltip
      />,
    )
    expect(container.querySelector('table')).toBeTruthy() // visually-hidden data table
    expect(container.querySelector('[role="application"]')).toBeTruthy() // keyboard layer
    expect(container.querySelector('svg[role="img"]')).toBeTruthy()
  })

  it('stays on SVG by default and under the auto threshold', () => {
    const { container } = render(
      <ScatterChart series={series} title="Small" width={400} height={300} renderer="auto" />,
    )
    expect(container.querySelector('canvas[data-canvas-layer]')).toBeNull()
    expect(container.querySelectorAll('circle').length).toBe(50)
  })
})
