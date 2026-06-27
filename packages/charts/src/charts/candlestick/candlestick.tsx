'use client'
import { useSignals } from '@cascivo/core'
import { ChartFrame } from '../../core/chart-frame'
import { DEFAULT_MARGINS, PLAIN_MARGINS } from '../../core/use-chart'
import { Axis } from '../../chrome/axis'
import { GridLines } from '../../chrome/grid-lines'
import { bandScale, linearScale } from '../../engine/scale'
import type { ChartPoint, TooltipModel } from '../../core/data-point'

export interface CandlestickDatum {
  /** Period label (date string or index). */
  t: string
  open: number
  high: number
  low: number
  close: number
  /** Optional traded volume for the secondary axis. */
  volume?: number
}

export interface CandlestickProps {
  data: readonly CandlestickDatum[]
  title: string
  description?: string
  width?: number
  height?: number
  yTicks?: number
  /** Colour for up candles (close ≥ open). */
  upColor?: string
  /** Colour for down candles (close < open). */
  downColor?: string
  /** Render volume bars beneath the candles. */
  volume?: boolean
  tooltip?: boolean
  className?: string
  plain?: boolean
}

export function Candlestick({
  data,
  title,
  description,
  width: fixedWidth,
  height,
  yTicks = 5,
  upColor = 'var(--cascivo-chart-2)',
  downColor = 'var(--cascivo-chart-4)',
  volume,
  tooltip,
  className,
  plain,
}: CandlestickProps) {
  useSignals()
  const margins = plain ? PLAIN_MARGINS : DEFAULT_MARGINS
  const resolvedHeight = height ?? (plain ? 64 : 320)
  const hasData = data.length > 0

  const lo = hasData ? Math.min(...data.map((d) => d.low)) : 0
  const hi = hasData ? Math.max(...data.map((d) => d.high)) : 1
  const maxVol = hasData ? Math.max(1, ...data.map((d) => d.volume ?? 0)) : 1
  const labels = data.map((d) => d.t)

  const fallback = (
    <table>
      <caption>{title}</caption>
      <thead>
        <tr>
          <th>Period</th>
          <th>Open</th>
          <th>High</th>
          <th>Low</th>
          <th>Close</th>
        </tr>
      </thead>
      <tbody>
        {data.map((d, i) => (
          <tr key={i}>
            <td>{d.t}</td>
            <td>{d.open}</td>
            <td>{d.high}</td>
            <td>{d.low}</td>
            <td>{d.close}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  const buildTooltip = ({
    width: w,
    height: h,
  }: {
    width: number
    height: number
  }): TooltipModel | undefined => {
    if (tooltip === false || !hasData) return undefined
    const innerW = w - margins.left - margins.right
    const innerH = h - margins.top - margins.bottom
    if (innerW <= 0) return undefined
    const xScale = bandScale(labels, [0, innerW], 0.3)
    const yScale = linearScale([lo, hi], [innerH, 0])
    const points: ChartPoint[] = data.map((d, i) => ({
      id: `c-${i}`,
      cx: margins.left + (xScale.map(d.t) ?? 0) + xScale.bandwidth / 2,
      cy: margins.top + yScale.map(d.high),
      label: d.t,
      value: d.close,
    }))
    const format = (p: ChartPoint): string => {
      const d = data[parseInt(p.id.split('-')[1] ?? '0', 10)]
      return d
        ? `${d.t} — O ${d.open} H ${d.high} L ${d.low} C ${d.close}`
        : `${p.label}: ${p.value}`
    }
    return { points, format }
  }

  return (
    <ChartFrame
      title={title}
      description={description}
      width={fixedWidth}
      height={resolvedHeight}
      fallback={fallback}
      className={className}
      data-state={hasData ? undefined : 'empty'}
      plain={plain}
      tooltip={tooltip !== false && hasData ? buildTooltip : undefined}
    >
      {({ width: w, height: h }) => {
        const innerW = w - margins.left - margins.right
        const innerH = h - margins.top - margins.bottom
        if (innerW <= 0 || !hasData) return null
        const xScale = bandScale(labels, [0, innerW], 0.3)
        const yScale = linearScale([lo, hi], [innerH, 0])
        const volH = volume ? Math.min(innerH * 0.2, 60) : 0
        const candleH = innerH - volH
        const candleY = linearScale([lo, hi], [candleH, 0])
        const bw = xScale.bandwidth

        return (
          <g transform={`translate(${margins.left},${margins.top})`}>
            {!plain && (
              <GridLines scale={yScale} orientation="y" length={innerW} tickCount={yTicks} />
            )}
            {data.map((d, i) => {
              const x = (xScale.map(d.t) ?? 0) + bw / 2
              const up = d.close >= d.open
              const color = up ? upColor : downColor
              const yOpen = candleY.map(d.open)
              const yClose = candleY.map(d.close)
              const bodyTop = Math.min(yOpen, yClose)
              const bodyH = Math.max(1, Math.abs(yClose - yOpen))
              return (
                <g key={i} data-candle={up ? 'up' : 'down'}>
                  <line
                    x1={x}
                    x2={x}
                    y1={candleY.map(d.high)}
                    y2={candleY.map(d.low)}
                    stroke={color}
                    strokeWidth={1}
                    data-wick=""
                  />
                  <rect
                    x={x - bw / 2}
                    y={bodyTop}
                    width={bw}
                    height={bodyH}
                    fill={color}
                    data-body=""
                  />
                  {volume && d.volume !== undefined && (
                    <rect
                      x={x - bw / 2}
                      y={candleH + (volH - (d.volume / maxVol) * volH)}
                      width={bw}
                      height={(d.volume / maxVol) * volH}
                      fill={color}
                      fillOpacity={0.4}
                      data-volume=""
                    />
                  )}
                </g>
              )
            })}
            {!plain && (
              <>
                <Axis
                  scale={xScale}
                  orientation="x"
                  length={innerW}
                  transform={`translate(0,${innerH})`}
                />
                <Axis scale={yScale} orientation="y" length={candleH} tickCount={yTicks} />
              </>
            )}
          </g>
        )
      }}
    </ChartFrame>
  )
}
