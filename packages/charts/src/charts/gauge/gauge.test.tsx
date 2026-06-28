import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Gauge } from './gauge'

describe('Gauge', () => {
  it('points the needle proportionally to (value-min)/(max-min)', () => {
    const { container } = render(
      <Gauge title="G" value={50} min={0} max={100} width={240} height={240} />,
    )
    const needle = container.querySelector('[data-needle]')!
    expect(Number(needle.getAttribute('data-frac'))).toBeCloseTo(0.5, 3)
  })

  it('clamps out-of-range values', () => {
    const { container } = render(
      <Gauge title="G" value={500} min={0} max={100} width={240} height={240} />,
    )
    expect(Number(container.querySelector('[data-needle]')!.getAttribute('data-frac'))).toBe(1)
  })

  it('renders threshold zones', () => {
    const { container } = render(
      <Gauge
        title="G"
        value={40}
        width={240}
        height={240}
        thresholds={[
          { upTo: 50, color: 'green' },
          { upTo: 100, color: 'red' },
        ]}
      />,
    )
    expect(container.querySelectorAll('[data-zone]').length).toBe(2)
  })

  it('renders a readout and an a11y title', () => {
    const { container, getByLabelText } = render(
      <Gauge title="Speed" value={30} unit="%" width={240} height={240} />,
    )
    expect(getByLabelText('Speed')).toBeTruthy()
    expect(container.querySelector('[data-readout]')!.textContent).toBe('30%')
  })
})
