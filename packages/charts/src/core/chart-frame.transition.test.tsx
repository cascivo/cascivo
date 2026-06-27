import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { ChartFrame } from './chart-frame'

const marks = () => <rect data-series="a" x={0} y={0} width={10} height={10} />

describe('ChartFrame transition config', () => {
  it('writes a custom duration/easing as CSS variables on the frame', () => {
    const { container } = render(
      <ChartFrame
        title="T"
        width={400}
        height={300}
        transition={{ duration: 1000, easing: 'linear' }}
      >
        {marks}
      </ChartFrame>,
    )
    const frame = container.firstElementChild as HTMLElement
    expect(frame.style.getPropertyValue('--cascivo-chart-anim-dur')).toBe('1000ms')
    expect(frame.style.getPropertyValue('--cascivo-chart-anim-ease')).toBe('linear')
  })

  it('marks the frame static when transition={false}', () => {
    const { container } = render(
      <ChartFrame title="T" width={400} height={300} transition={false}>
        {marks}
      </ChartFrame>,
    )
    expect(container.querySelector('[data-no-anim]')).toBeTruthy()
  })

  it('adds no animation vars or attribute by default', () => {
    const { container } = render(
      <ChartFrame title="T" width={400} height={300}>
        {marks}
      </ChartFrame>,
    )
    const frame = container.firstElementChild as HTMLElement
    expect(frame.style.getPropertyValue('--cascivo-chart-anim-dur')).toBe('')
    expect(container.querySelector('[data-no-anim]')).toBeNull()
  })
})

describe('ChartFrame draw hooks', () => {
  it('renders onBeforeDraw behind and onAfterDraw over the marks', () => {
    const { container } = render(
      <ChartFrame
        title="T"
        width={400}
        height={300}
        onBeforeDraw={() => <rect data-bg="" />}
        onAfterDraw={() => <rect data-overlay="" />}
      >
        {marks}
      </ChartFrame>,
    )
    const svg = container.querySelector('svg')!
    const order = [...svg.querySelectorAll('[data-bg], [data-series], [data-overlay]')].map((el) =>
      el.getAttribute('data-bg') !== null
        ? 'bg'
        : el.getAttribute('data-overlay') !== null
          ? 'overlay'
          : 'marks',
    )
    expect(order).toEqual(['bg', 'marks', 'overlay'])
  })
})
