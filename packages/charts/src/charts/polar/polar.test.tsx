import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Polar } from './polar'

const data = [
  { label: 'N', value: 12 },
  { label: 'E', value: 8 },
  { label: 'S', value: 5 },
  { label: 'W', value: 15 },
]

describe('Polar', () => {
  it('renders one wedge per category in bar mode', () => {
    const { container } = render(
      <Polar data={data} title="Rose" width={320} height={320} mode="bar" />,
    )
    expect(container.querySelectorAll('[data-wedge]').length).toBe(4)
  })

  it('renders a closed polyline in line mode and a fill in area mode', () => {
    const { container, rerender } = render(
      <Polar data={data} title="Line" width={320} height={320} mode="line" />,
    )
    expect(container.querySelector('[data-polyline]')).toBeTruthy()
    expect(container.querySelector('[data-area]')).toBeNull()
    rerender(<Polar data={data} title="Area" width={320} height={320} mode="area" />)
    expect(container.querySelector('[data-area]')).toBeTruthy()
  })

  it('renders the configured number of radial rings and angular labels', () => {
    const { container } = render(
      <Polar data={data} title="Rings" width={320} height={320} rings={3} />,
    )
    expect(container.querySelectorAll('[data-ring]').length).toBe(3)
    expect(container.querySelectorAll('[data-angle-label]').length).toBe(4)
  })

  it('shows a placeholder when empty', () => {
    const { container, getByLabelText } = render(
      <Polar data={[]} title="Empty" width={320} height={320} />,
    )
    expect(getByLabelText('Empty')).toBeTruthy()
    expect(container.querySelector('[data-empty]')).toBeTruthy()
  })
})
