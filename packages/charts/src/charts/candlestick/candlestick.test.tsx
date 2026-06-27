import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Candlestick } from './candlestick'

const data = [
  { t: 'Mon', open: 10, high: 14, low: 9, close: 13 }, // up
  { t: 'Tue', open: 13, high: 15, low: 11, close: 11 }, // down
  { t: 'Wed', open: 11, high: 12, low: 8, close: 9 }, // down
]

describe('Candlestick', () => {
  it('renders N bodies and N wicks', () => {
    const { container } = render(<Candlestick data={data} title="OHLC" width={400} height={300} />)
    expect(container.querySelectorAll('[data-body]').length).toBe(3)
    expect(container.querySelectorAll('[data-wick]').length).toBe(3)
  })

  it('colours up and down candles distinctly', () => {
    const { container } = render(
      <Candlestick
        data={data}
        title="OHLC"
        width={400}
        height={300}
        upColor="green"
        downColor="red"
      />,
    )
    const up = container.querySelector('[data-candle="up"] [data-body]')
    const down = container.querySelector('[data-candle="down"] [data-body]')
    expect(up!.getAttribute('fill')).toBe('green')
    expect(down!.getAttribute('fill')).toBe('red')
  })

  it('renders volume bars only when requested', () => {
    const withVol = [
      { ...data[0]!, volume: 100 },
      { ...data[1]!, volume: 50 },
    ]
    const { container, rerender } = render(
      <Candlestick data={withVol} title="V" width={400} height={300} />,
    )
    expect(container.querySelectorAll('[data-volume]').length).toBe(0)
    rerender(<Candlestick data={withVol} title="V" width={400} height={300} volume />)
    expect(container.querySelectorAll('[data-volume]').length).toBe(2)
  })

  it('shows a placeholder and a11y title when empty', () => {
    const { container, getByLabelText } = render(
      <Candlestick data={[]} title="Empty" width={400} height={300} />,
    )
    expect(getByLabelText('Empty')).toBeTruthy()
    expect(container.querySelector('[data-empty]')).toBeTruthy()
  })
})
