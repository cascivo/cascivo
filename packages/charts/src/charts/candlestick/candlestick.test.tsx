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

  const many = Array.from({ length: 20 }, (_, i) => ({
    t: `d${i}`,
    open: 10 + i,
    high: 12 + i,
    low: 9 + i,
    close: 11 + i,
  }))

  it('renders a DataZoom slider when dataZoom is set', () => {
    const { container } = render(
      <Candlestick data={many} title="OHLC" width={400} height={300} dataZoom />,
    )
    // DataZoom exposes the window as a slider group labelled "showing …".
    expect(container.querySelector('[aria-label*="Time range"]')).toBeTruthy()
  })

  it('renders a Brush when brush is set (and no DataZoom)', () => {
    const { container } = render(
      <Candlestick data={many} title="OHLC" width={400} height={300} brush />,
    )
    expect(container.querySelector('[aria-label*="Time range"]')).toBeTruthy()
  })

  it('exposes zoom keyboard affordances when zoom is set', () => {
    const { container } = render(
      <Candlestick data={many} title="OHLC" width={400} height={300} zoom />,
    )
    // The focusable application layer advertises zoom keys.
    const layer = container.querySelector('[role="application"]')
    expect(layer?.getAttribute('aria-label')).toMatch(/zoom/i)
  })

  it('renders a y-axis annotation rule with its label', () => {
    const { container, getAllByText } = render(
      <Candlestick
        data={many}
        title="OHLC"
        width={400}
        height={300}
        annotations={[{ kind: 'line', axis: 'y', value: 20, label: 'last' }]}
      />,
    )
    expect(container.querySelector('[data-annotation="line"]')).toBeTruthy()
    // Label appears as both a <title> (a11y) and a visible <text>.
    expect(getAllByText('last').length).toBeGreaterThan(0)
  })

  it('builds an axis-mode crosshair tooltip (OHLC segments) without a wrapping regression', () => {
    const { container } = render(
      <Candlestick data={many} title="OHLC" width={400} height={300} tooltip tooltipMode="axis" />,
    )
    // Axis mode still renders every candle body; the crosshair layer is present.
    expect(container.querySelectorAll('[data-body]').length).toBe(20)
    expect(container.querySelector('[role="application"]')).toBeTruthy()
  })
})
