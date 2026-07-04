'use client'
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { useRef } from 'react'
import { ChartFrame } from '../../core/chart-frame'
import { DEFAULT_MARGINS, PLAIN_MARGINS } from '../../core/use-chart'
import { getSyncGroup, releaseSyncGroup, type SyncGroup } from '../../core/sync'
import { Axis } from '../../chrome/axis'
import { GridLines } from '../../chrome/grid-lines'
import { Brush } from '../../chrome/brush'
import { DataZoom } from '../../chrome/data-zoom'
import { renderAnnotations, type Annotation } from '../../chrome/reference'
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
  /** Reference lines, shaded bands, and markers over the plot (e.g. a last-price rule). */
  annotations?: readonly Annotation[]
  /** Show a keyboard-operable Brush below the plot to subset (zoom) the candles to a window. */
  brush?: boolean
  /** Show a DataZoom slider below the plot — a Brush whose body also pans the window. */
  dataZoom?: boolean
  /** Enable in-plot wheel/drag/keyboard zoom-pan (`+`/`-`/`0`) over the candle index window. */
  zoom?: boolean
  /** Connect this chart to others sharing the same id — they mirror the zoom window. */
  syncId?: string
  /** Tooltip trigger: `item` (default, nearest candle) or `axis` (crosshair + OHLC at hovered x). */
  tooltipMode?: 'item' | 'axis'
}

export function Candlestick({
  data: rawData,
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
  annotations,
  brush,
  dataZoom,
  zoom,
  syncId,
  tooltipMode,
}: CandlestickProps) {
  useSignals()
  const margins = plain ? PLAIN_MARGINS : DEFAULT_MARGINS
  const resolvedHeight = height ?? (plain ? 64 : 320)

  // Index window — when any zoom affordance is on, the plot renders only this range.
  const fullLen = rawData.length
  const windowed = (brush || dataZoom || zoom || syncId !== undefined) && fullLen > 0
  const win = useSignal<[number, number]>([0, Math.max(0, fullLen - 1)])

  // Connect: mirror this chart's window to/from the shared sync group (no feedback loop).
  const syncRef = useRef<SyncGroup | null>(null)
  if (syncId && !syncRef.current) syncRef.current = getSyncGroup(syncId)
  useSignalEffect(() => () => {
    if (syncId) releaseSyncGroup(syncId)
  })
  useSignalEffect(() => {
    const g = syncRef.current
    if (!g) return
    const shared = g.window.value
    const local = win.peek()
    if (shared && (shared[0] !== local[0] || shared[1] !== local[1])) win.value = shared
  })
  useSignalEffect(() => {
    const g = syncRef.current
    if (!g) return
    const local = win.value
    const shared = g.window.peek()
    if (!shared || shared[0] !== local[0] || shared[1] !== local[1]) g.window.value = local
  })

  const data = windowed ? rawData.slice(win.value[0], win.value[1] + 1) : rawData
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
    const volH = volume ? Math.min(innerH * 0.2, 60) : 0
    const candleH = innerH - volH
    const candleY = linearScale([lo, hi], [candleH, 0])

    // Axis mode — one focusable candle per x with a crosshair + OHLC breakdown.
    if (tooltipMode === 'axis') {
      const points: ChartPoint[] = data.map((d, i) => ({
        id: `c-${i}`,
        cx: margins.left + (xScale.map(d.t) ?? 0) + xScale.bandwidth / 2,
        cy: margins.top + candleY.map(d.high),
        label: d.t,
        value: d.close,
        segments: [
          { label: 'O', value: d.open },
          { label: 'H', value: d.high },
          { label: 'L', value: d.low },
          { label: 'C', value: d.close },
        ],
      }))
      const format = (p: ChartPoint): string => {
        const d = data[parseInt(p.id.split('-')[1] ?? '0', 10)]
        return d
          ? `${d.t} — O ${d.open} H ${d.high} L ${d.low} C ${d.close}`
          : `${p.label}: ${p.value}`
      }
      return { points, mode: 'axis', format }
    }

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
        zoom={zoom && fullLen > 1 ? { window: win, count: fullLen } : undefined}
        onRestore={
          windowed
            ? () => {
                win.value = [0, Math.max(0, fullLen - 1)]
              }
            : undefined
        }
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
              {!plain &&
                renderAnnotations(annotations, {
                  xScale: xScale as { map: (v: never) => number | undefined; bandwidth?: number },
                  yScale: candleY,
                  innerW,
                  innerH: candleH,
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
      {brush && !dataZoom && fullLen > 1 && (
        <Brush count={fullLen} window={win} label="Time range" />
      )}
      {dataZoom && fullLen > 1 && <DataZoom count={fullLen} window={win} label="Time range" />}
    </div>
  )
}
