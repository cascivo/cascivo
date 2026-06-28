import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import {
  renderAnnotation,
  renderAnnotations,
  annotationSummary,
  type Annotation,
} from './reference'
import { linearScale } from '../engine/scale'
import { LineChart } from '../charts/line-chart/line-chart'

const yScale = linearScale([0, 100], [200, 0]) // map(50) === 100
const xScale = linearScale([0, 10], [0, 300]) // map(5) === 150
const ctx = { xScale, yScale, innerW: 300, innerH: 200 }

function renderSvg(node: React.ReactNode) {
  return render(<svg>{node}</svg>)
}

describe('renderAnnotation', () => {
  it('places a y reference line at the mapped value with a labelled title', () => {
    const a: Annotation = { kind: 'line', axis: 'y', value: 50, label: 'SLO' }
    const { container } = renderSvg(renderAnnotation(a, ctx, 0))
    const line = container.querySelector('line')!
    expect(line.getAttribute('y1')).toBe('100')
    expect(line.getAttribute('y2')).toBe('100')
    expect(line.getAttribute('x1')).toBe('0')
    expect(line.getAttribute('x2')).toBe('300')
    expect(container.querySelector('title')?.textContent).toBe('SLO')
    expect(container.querySelector('text')?.textContent).toBe('SLO')
  })

  it('places an x reference line at the mapped value', () => {
    const a: Annotation = { kind: 'line', axis: 'x', value: 5 }
    const { container } = renderSvg(renderAnnotation(a, ctx, 0))
    const line = container.querySelector('line')!
    expect(line.getAttribute('x1')).toBe('150')
    expect(line.getAttribute('y2')).toBe('200')
  })

  it('shades a reference area between two mapped bounds', () => {
    const a: Annotation = { kind: 'area', axis: 'y', from: 25, to: 75 }
    const { container } = renderSvg(renderAnnotation(a, ctx, 0))
    const rect = container.querySelector('rect')!
    // map(75)=50, map(25)=150 -> start=50, height=100
    expect(rect.getAttribute('y')).toBe('50')
    expect(rect.getAttribute('height')).toBe('100')
    expect(rect.getAttribute('width')).toBe('300')
  })

  it('centers a reference dot at the mapped point', () => {
    const a: Annotation = { kind: 'dot', x: 5, y: 50, label: 'peak' }
    const { container } = renderSvg(renderAnnotation(a, ctx, 0))
    const circle = container.querySelector('circle')!
    expect(circle.getAttribute('cx')).toBe('150')
    expect(circle.getAttribute('cy')).toBe('100')
  })

  it('renders nothing when the value maps off-scale (NaN)', () => {
    const badScale = { map: () => Number.NaN }
    const a: Annotation = { kind: 'line', axis: 'y', value: 1 }
    const { container } = renderSvg(renderAnnotation(a, { ...ctx, yScale: badScale }, 0))
    expect(container.querySelector('line')).toBeNull()
  })
})

describe('renderAnnotations', () => {
  it('returns null for an empty or missing list', () => {
    expect(renderAnnotations(undefined, ctx)).toBeNull()
    expect(renderAnnotations([], ctx)).toBeNull()
  })
})

describe('note + threshold annotations', () => {
  it('note renders a subject, a connector, and the label (in the a11y tree)', () => {
    const { container } = renderSvg(
      renderAnnotation({ kind: 'note', x: 5, y: 50, label: 'peak' }, ctx, 0),
    )
    expect(container.querySelector('[data-annotation="note"]')).toBeTruthy()
    expect(container.querySelector('line')).toBeTruthy()
    expect(container.querySelector('circle')).toBeTruthy()
    const text = container.querySelector('text')!
    expect(text.textContent).toBe('peak')
    expect(text.getAttribute('aria-hidden')).toBeNull() // notes are information
  })

  it('threshold shades the requested side of the value', () => {
    // map(50) === 100, innerH === 200
    const above = renderSvg(
      renderAnnotation({ kind: 'threshold', value: 50, side: 'above' }, ctx, 0),
    )
    const r1 = above.container.querySelector('rect')!
    expect(r1.getAttribute('y')).toBe('0')
    expect(r1.getAttribute('height')).toBe('100')

    const below = renderSvg(
      renderAnnotation({ kind: 'threshold', value: 50, side: 'below' }, ctx, 0),
    )
    const r2 = below.container.querySelector('rect')!
    expect(r2.getAttribute('y')).toBe('100')
    expect(r2.getAttribute('height')).toBe('100')
  })
})

describe('annotationSummary', () => {
  it('summarizes each annotation kind', () => {
    expect(annotationSummary({ kind: 'line', axis: 'y', value: 80, label: 'Goal' })).toBe('Goal')
    expect(annotationSummary({ kind: 'line', axis: 'y', value: 80 })).toBe('y=80')
    expect(annotationSummary({ kind: 'dot', x: 1, y: 2 })).toBe('(1, 2)')
  })
})

describe('LineChart annotations integration', () => {
  const series = [
    {
      id: 'a',
      label: 'Rev',
      data: [
        { x: 0, y: 10 },
        { x: 1, y: 90 },
      ],
    },
  ]

  it('draws an annotation line with its label', () => {
    const { container } = render(
      <LineChart
        series={series}
        x={(d) => d.x}
        y={(d) => d.y}
        title="Rev"
        width={400}
        height={300}
        annotations={[{ kind: 'line', axis: 'y', value: 50, label: 'Target' }]}
      />,
    )
    const group = container.querySelector('[data-annotations]')
    expect(group).toBeTruthy()
    expect(group?.querySelector('title')?.textContent).toBe('Target')
  })

  it('omits annotations in plain mode', () => {
    const { container } = render(
      <LineChart
        series={series}
        x={(d) => d.x}
        y={(d) => d.y}
        title="Rev"
        width={400}
        height={48}
        plain
        annotations={[{ kind: 'line', axis: 'y', value: 50, label: 'Target' }]}
      />,
    )
    expect(container.querySelector('[data-annotations]')).toBeNull()
  })
})
