/**
 * ChartFrame container-tracking regression tests.
 *
 * `height` used to default to `300` in the destructure, which made `fixedHeight` always
 * defined and so made `const h = fixedHeight ?? height.value` unconditionally `300`.
 * `useChartSize`'s height signal was recomputed on every resize and never read — a dead
 * branch, and the reason a chart in a 240px grid cell rendered a 300px SVG and spilled 35px
 * past its card border.
 *
 * Nothing caught it because every existing ChartFrame test passes an explicit `height`,
 * which is exactly the case that was never broken.
 *
 * jsdom has no `ResizeObserver`, so `useChartSize` takes its documented fallback path and
 * measures once via `getBoundingClientRect` — which is enough to prove the value is read.
 */
import { describe, expect, it, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { ChartFrame } from './chart-frame'

afterEach(cleanup)

/** Make every element report a fixed box, the way a constrained grid cell would. */
function stubLayout(width: number, height: number): () => void {
  const original = Element.prototype.getBoundingClientRect
  Element.prototype.getBoundingClientRect = function (): DOMRect {
    return { width, height, top: 0, left: 0, right: width, bottom: height, x: 0, y: 0 } as DOMRect
  }
  return () => {
    Element.prototype.getBoundingClientRect = original
  }
}

function svgOf(container: HTMLElement): SVGSVGElement {
  const svg = container.querySelector('svg')
  expect(svg, 'ChartFrame should render an <svg>').not.toBeNull()
  return svg as SVGSVGElement
}

describe('ChartFrame container tracking', () => {
  it('takes its height from the container when `height` is omitted', () => {
    const restore = stubLayout(680, 240)
    try {
      const { container } = render(
        <ChartFrame title="Revenue">{() => <rect data-testid="mark" />}</ChartFrame>,
      )
      expect(svgOf(container).getAttribute('height')).toBe('240')
    } finally {
      restore()
    }
  })

  it('still honours an explicit `height`, ignoring the container', () => {
    const restore = stubLayout(680, 240)
    try {
      const { container } = render(
        <ChartFrame title="Revenue" height={120}>
          {() => <rect />}
        </ChartFrame>,
      )
      expect(svgOf(container).getAttribute('height')).toBe('120')
    } finally {
      restore()
    }
  })

  it('falls back to 300 when the container reports no height', () => {
    // An auto-height parent measures 0; `useChartSize` only ever writes a measurement > 0,
    // so the seed stands rather than collapsing the chart to nothing.
    const restore = stubLayout(0, 0)
    try {
      const { container } = render(<ChartFrame title="Revenue">{() => <rect />}</ChartFrame>)
      expect(svgOf(container).getAttribute('height')).toBe('300')
    } finally {
      restore()
    }
  })

  it('keeps the viewBox in step with the rendered size, so the SVG can scale', () => {
    const restore = stubLayout(680, 240)
    try {
      const { container } = render(<ChartFrame title="Revenue">{() => <rect />}</ChartFrame>)
      const svg = svgOf(container)
      expect(svg.getAttribute('viewBox')).toBe(
        `0 0 ${svg.getAttribute('width')} ${svg.getAttribute('height')}`,
      )
    } finally {
      restore()
    }
  })

  it('passes the measured height to the children render prop', () => {
    // The plot draws from this, so a mismatch here is a chart drawn to the wrong box even
    // when the SVG element itself is the right size.
    const restore = stubLayout(680, 240)
    let seen: { width: number; height: number } | null = null
    try {
      render(
        <ChartFrame title="Revenue">
          {(size) => {
            seen = size
            return <rect />
          }}
        </ChartFrame>,
      )
      expect(seen).toEqual({ width: 680, height: 240 })
    } finally {
      restore()
    }
  })
})
