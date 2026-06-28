import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { DataLabel, resolveLabels } from './data-label'
import { BarChart } from '../charts/bar-chart/bar-chart'
import { PieChart } from '../charts/pie-chart/pie-chart'

describe('resolveLabels', () => {
  it('returns null when disabled', () => {
    expect(resolveLabels(undefined)).toBeNull()
    expect(resolveLabels(false)).toBeNull()
  })

  it('defaults format + position when enabled with `true`', () => {
    const r = resolveLabels(true)!
    expect(r.position).toBe('auto')
    expect(r.format(1234)).toBe((1234).toLocaleString())
  })

  it('honors a custom format and position', () => {
    const r = resolveLabels({ format: (v) => `$${v}`, position: 'inside' })!
    expect(r.format(5)).toBe('$5')
    expect(r.position).toBe('inside')
  })
})

describe('DataLabel', () => {
  it('renders aria-hidden text at the anchor', () => {
    const { container } = render(
      <svg>
        <DataLabel x={10} y={20} text="42" />
      </svg>,
    )
    const text = container.querySelector('text')!
    expect(text.getAttribute('aria-hidden')).toBe('true')
    expect(text.getAttribute('x')).toBe('10')
    expect(text.textContent).toBe('42')
  })
})

const barSeries = [
  {
    id: 'a',
    label: 'A',
    data: [
      { x: 'Q1', y: 10 },
      { x: 'Q2', y: 40 },
    ],
  },
]

describe('BarChart labels', () => {
  it('prints a value label per bar', () => {
    const { container } = render(
      <BarChart
        series={barSeries}
        x={(d) => d.x}
        y={(d) => d.y}
        title="Rev"
        width={400}
        height={300}
        labels
      />,
    )
    const texts = [...container.querySelectorAll('text[data-data-label]')].map((t) => t.textContent)
    expect(texts).toContain('10')
    expect(texts).toContain('40')
  })

  it('renders no labels in plain mode', () => {
    const { container } = render(
      <BarChart
        series={barSeries}
        x={(d) => d.x}
        y={(d) => d.y}
        title="Rev"
        width={400}
        height={48}
        plain
        labels
      />,
    )
    expect(container.querySelector('text[data-data-label]')).toBeNull()
  })
})

describe('PieChart labels', () => {
  it('defaults to percentage labels and keeps values in the fallback table', () => {
    const { container } = render(
      <PieChart
        title="Share"
        width={300}
        height={300}
        labels
        data={[
          { id: 'a', label: 'A', value: 75 },
          { id: 'b', label: 'B', value: 25 },
        ]}
      />,
    )
    const texts = [...container.querySelectorAll('text[data-data-label]')].map((t) => t.textContent)
    expect(texts).toContain('75%')
    expect(texts).toContain('25%')
    // values remain reachable via the fallback table (a11y not regressed)
    expect(container.querySelector('table')).toBeTruthy()
  })
})
