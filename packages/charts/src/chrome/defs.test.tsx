import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { ChartDefs, fillFor, gradientId, patternId } from './defs'
import { AreaChart } from '../charts/area-chart/area-chart'

const series = [
  { id: 'a', color: 'var(--cascivo-chart-1)' },
  { id: 'b', color: 'var(--cascivo-chart-2)' },
]

describe('fillFor', () => {
  it('returns url() refs for gradient/pattern and the solid color otherwise', () => {
    expect(fillFor('p', 'a', 'solid', 'red')).toBe('red')
    expect(fillFor('p', 'a', 'gradient', 'red')).toBe(`url(#${gradientId('p', 'a')})`)
    expect(fillFor('p', 'a', 'pattern', 'red')).toBe(`url(#${patternId('p', 'a')})`)
  })

  it('sanitizes useId-style prefixes into id-safe strings', () => {
    expect(gradientId(':r0:', 'a')).toBe('r0-grad-a')
    expect(patternId(':r0:', 'x y')).toBe('r0-pat-xy')
  })
})

describe('ChartDefs', () => {
  it('renders nothing for solid', () => {
    const { container } = render(
      <svg>
        <ChartDefs prefix="p" series={series} fill="solid" />
      </svg>,
    )
    expect(container.querySelector('defs')).toBeNull()
  })

  it('mints one gradient per series', () => {
    const { container } = render(
      <svg>
        <ChartDefs prefix="p" series={series} fill="gradient" />
      </svg>,
    )
    expect(container.querySelectorAll('linearGradient').length).toBe(2)
    expect(container.querySelector(`#${gradientId('p', 'a')}`)).toBeTruthy()
  })

  it('mints one pattern per series with the requested motif', () => {
    const { container } = render(
      <svg>
        <ChartDefs prefix="p" series={series} fill="pattern" patternKind="cross" />
      </svg>,
    )
    expect(container.querySelectorAll('pattern').length).toBe(2)
    // cross motif → two lines per pattern
    expect(container.querySelectorAll('pattern line').length).toBe(4)
  })
})

describe('AreaChart gradient fill integration', () => {
  const data = [
    {
      id: 's',
      label: 'S',
      data: [
        { x: 0, y: 1 },
        { x: 1, y: 4 },
        { x: 2, y: 2 },
      ],
    },
  ]
  it('renders defs and references them in the area fill', () => {
    const { container } = render(
      <AreaChart
        series={data}
        x={(d) => d.x}
        y={(d) => d.y}
        title="Grad"
        width={400}
        height={300}
        fill="gradient"
      />,
    )
    expect(container.querySelector('linearGradient')).toBeTruthy()
    const filled = [...container.querySelectorAll('path[fill^="url(#"]')]
    expect(filled.length).toBeGreaterThan(0)
  })
})
