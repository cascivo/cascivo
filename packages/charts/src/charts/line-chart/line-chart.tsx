'use client'
import { useSignal, useSignals } from '@cascade-ui/core'
import { useRef } from 'react'
import { ChartFrame } from '../../core/chart-frame'
import { DEFAULT_MARGINS, PLAIN_MARGINS } from '../../core/use-chart'
import { Axis } from '../../chrome/axis'
import { GridLines } from '../../chrome/grid-lines'
import { Legend } from '../../chrome/legend'
import { linearScale } from '../../engine/scale'
import { timeScale } from '../../engine/scale-time'
import { linePath } from '../../engine/shape'
import { nearestIndex } from '../../engine/nearest'
import type { Point } from '../../engine/shape'

export interface LineChartSeries<Datum> {
  id: string
  label: string
  data: readonly Datum[]
  color?: string
}

export interface LineChartProps<Datum = { x: number; y: number }> {
  series: readonly LineChartSeries<Datum>[]
  x: (d: Datum) => number | Date
  y: (d: Datum) => number
  title: string
  description?: string
  curve?: 'linear' | 'monotone'
  width?: number
  height?: number
  xTicks?: number
  yTicks?: number
  legend?: boolean
  tooltip?: boolean
  formatTooltip?: (datum: Datum, series: LineChartSeries<Datum>) => string
  className?: string
  /** Render only the marks — no axes, grid lines, or legend. For micro/inline charts. */
  plain?: boolean
}

const COLORS = Array.from({ length: 8 }, (_, i) => `var(--cascade-chart-${i + 1})`)

export function LineChart<Datum = { x: number; y: number }>({
  series,
  x,
  y,
  title,
  description,
  curve = 'monotone',
  width: fixedWidth,
  height,
  xTicks = 5,
  yTicks = 5,
  legend,
  formatTooltip,
  className,
  plain,
}: LineChartProps<Datum>) {
  useSignals()
  const hidden = useSignal(new Set<string>())
  const crosshairRef = useRef<SVGLineElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const margins = plain ? PLAIN_MARGINS : DEFAULT_MARGINS
  const resolvedHeight = height ?? (plain ? 48 : 300)
  const showLegend = plain ? false : (legend ?? series.length > 1)

  const allX = series.flatMap((s) => s.data.map((d) => x(d)))
  const allY = series.flatMap((s) => s.data.map((d) => y(d)))
  const hasData = allX.length > 0

  const usesDate = hasData && allX[0] instanceof Date

  const fallback = (
    <table>
      <caption>{title}</caption>
      <thead>
        <tr>
          <th>X</th>
          {series.map((s) => (
            <th key={s.id}>{s.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {(series[0]?.data ?? []).map((_, i) => (
          <tr key={i}>
            <td>{String(series[0] ? x(series[0].data[i]!) : '')}</td>
            {series.map((s) => (
              <td key={s.id}>{s.data[i] != null ? y(s.data[i]!) : ''}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )

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
      >
        {({ width, height: h }) => {
          const innerW = width - margins.left - margins.right
          const innerH = h - margins.top - margins.bottom

          const xMin = usesDate
            ? Math.min(...(allX as Date[]).map((d) => d.getTime()))
            : Math.min(...(allX as number[]))
          const xMax = usesDate
            ? Math.max(...(allX as Date[]).map((d) => d.getTime()))
            : Math.max(...(allX as number[]))
          const yMin = Math.min(0, ...allY)
          const yMax = Math.max(...allY)

          const xScale = usesDate
            ? timeScale([new Date(xMin), new Date(xMax)], [0, innerW])
            : linearScale([xMin, xMax], [0, innerW])
          const yScale = linearScale([yMin, yMax], [innerH, 0])

          // Compute all x-positions for crosshair nearest lookup
          const allXNums = usesDate
            ? (series[0]?.data ?? []).map((d) => {
                const v = x(d)
                return v instanceof Date ? v.getTime() : (v as number)
              })
            : (series[0]?.data ?? []).map((d) => x(d) as number)

          // Pointer move handler — zero React re-renders
          const handlePointerMove = (e: React.PointerEvent<SVGRectElement>) => {
            const svgEl = e.currentTarget.closest('svg')
            if (!svgEl) return
            const rect = svgEl.getBoundingClientRect()
            const pointerX = e.clientX - rect.left - margins.left
            const xVal = usesDate
              ? (xScale as ReturnType<typeof timeScale>).invert(pointerX).getTime()
              : (xScale as ReturnType<typeof linearScale>).invert(pointerX)
            const idx = nearestIndex(allXNums, xVal)
            if (idx < 0) return
            const xPos = usesDate
              ? (xScale as ReturnType<typeof timeScale>).map(new Date(allXNums[idx]!))
              : (xScale as ReturnType<typeof linearScale>).map(allXNums[idx]!)
            if (crosshairRef.current) {
              crosshairRef.current.setAttribute('x1', String(xPos))
              crosshairRef.current.setAttribute('x2', String(xPos))
              crosshairRef.current.style.opacity = '1'
            }
            if (tooltipRef.current && series[0]) {
              const s = series[0]
              const d = s.data[idx]
              if (d) {
                const text = formatTooltip ? formatTooltip(d, s) : String(y(d))
                tooltipRef.current.textContent = text
                tooltipRef.current.style.transform = `translate(${xPos + margins.left + 8}px, ${margins.top}px)`
                tooltipRef.current.style.opacity = '1'
              }
            }
          }

          const handlePointerLeave = () => {
            if (crosshairRef.current) crosshairRef.current.style.opacity = '0'
            if (tooltipRef.current) tooltipRef.current.style.opacity = '0'
          }

          return (
            <g>
              <g transform={`translate(${margins.left},${margins.top})`}>
                {!plain && (
                  <GridLines scale={yScale} orientation="y" length={innerW} tickCount={yTicks} />
                )}
                {series.map((s, i) => {
                  if (hidden.value.has(s.id)) return null
                  const points: Point[] = s.data.map((d) => {
                    const xv = x(d)
                    const xPos = usesDate
                      ? (xScale as ReturnType<typeof timeScale>).map(xv as Date)
                      : (xScale as ReturnType<typeof linearScale>).map(xv as number)
                    return [xPos, yScale.map(y(d))]
                  })
                  const color = s.color ?? COLORS[i % COLORS.length]!
                  return (
                    <path
                      key={s.id}
                      d={linePath(points, curve)}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      data-series={s.id}
                    />
                  )
                })}
                <line
                  ref={crosshairRef}
                  x1={0}
                  x2={0}
                  y1={0}
                  y2={innerH}
                  stroke="var(--cascade-chart-axis)"
                  strokeWidth={1}
                  strokeDasharray="4 2"
                  style={{ opacity: 0, transition: 'opacity 150ms ease', pointerEvents: 'none' }}
                />
                {!plain && (
                  <>
                    <Axis
                      scale={xScale}
                      orientation="x"
                      length={innerW}
                      tickCount={xTicks}
                      transform={`translate(0,${innerH})`}
                    />
                    <Axis scale={yScale} orientation="y" length={innerH} tickCount={yTicks} />
                  </>
                )}
                {/* Invisible pointer capture rect */}
                <rect
                  x={0}
                  y={0}
                  width={innerW}
                  height={innerH}
                  fill="transparent"
                  onPointerMove={handlePointerMove}
                  onPointerLeave={handlePointerLeave}
                />
              </g>
            </g>
          )
        }}
      </ChartFrame>
      {showLegend && (
        <Legend
          series={series.map((s, i) => ({
            id: s.id,
            label: s.label,
            color: s.color ?? COLORS[i % COLORS.length]!,
          }))}
          hidden={hidden}
        />
      )}
    </div>
  )
}
