'use client'
import { useSignals } from '@cascivo/core'
import { ChartFrame } from '../../core/chart-frame'
import { arcPath, linePath } from '../../engine/shape'
import { angleBand, polarPoint, radiusScale } from '../../engine/polar'
import type { Point } from '../../engine/shape'
import type { ChartPoint, TooltipModel } from '../../core/data-point'

export interface PolarDatum {
  label: string
  value: number
  color?: string
}

export interface PolarProps {
  data: readonly PolarDatum[]
  title: string
  description?: string
  /** Plot bars (a rose), or a polar line / filled area. */
  mode?: 'bar' | 'line' | 'area'
  width?: number
  height?: number
  /** Radial ring count. */
  rings?: number
  /** Domain top (full radius). Defaults to the largest value. */
  max?: number
  tooltip?: boolean
  className?: string
  plain?: boolean
}

const COLORS = Array.from({ length: 8 }, (_, i) => `var(--cascivo-chart-${i + 1})`)

export function Polar({
  data,
  title,
  description,
  mode = 'bar',
  width: fixedWidth,
  height,
  rings = 4,
  max,
  tooltip,
  className,
  plain,
}: PolarProps) {
  useSignals()
  const resolvedHeight = height ?? 320
  const hasData = data.length > 0
  const labels = data.map((d) => d.label)
  const maxValue = max ?? (hasData ? Math.max(1, ...data.map((d) => d.value)) : 1)
  const band = angleBand(labels)

  const fallback = (
    <table>
      <caption>{title}</caption>
      <thead>
        <tr>
          <th>Category</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {data.map((d, i) => (
          <tr key={i}>
            <td>{d.label}</td>
            <td>{d.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  const geom = (w: number, h: number) => {
    const cx = w / 2
    const cy = h / 2
    const outerR = Math.max(0, Math.min(w, h) / 2 - (plain ? 6 : 28))
    const rScale = radiusScale([0, maxValue], [0, outerR])
    return { cx, cy, outerR, rScale }
  }

  const buildTooltip = ({
    width: w,
    height: h,
  }: {
    width: number
    height: number
  }): TooltipModel | undefined => {
    if (tooltip === false || !hasData) return undefined
    const { cx, cy, rScale } = geom(w, h)
    const points: ChartPoint[] = data.map((d, i) => {
      const a = band.center(d.label) ?? 0
      const [x, y] = polarPoint(cx, cy, rScale.map(d.value), a)
      return { id: `p-${i}`, cx: x, cy: y, label: d.label, value: d.value }
    })
    return { points, format: (p) => `${p.label}: ${p.value}` }
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
        if (!hasData) return null
        const { cx, cy, outerR, rScale } = geom(w, h)
        const ringRadii = Array.from({ length: rings }, (_, i) => (outerR * (i + 1)) / rings)

        const linePts: Point[] = data.map((d) => {
          const a = band.center(d.label) ?? 0
          return polarPoint(cx, cy, rScale.map(d.value), a)
        })

        return (
          <g>
            {/* radial rings */}
            {!plain &&
              ringRadii.map((r, i) => (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke="var(--cascivo-chart-grid)"
                  strokeOpacity={0.4}
                  data-ring=""
                />
              ))}
            {mode === 'bar'
              ? data.map((d, i) => {
                  const start = band.map(d.label) ?? 0
                  const pad = band.bandwidth * 0.1
                  return (
                    <path
                      key={i}
                      d={arcPath(
                        cx,
                        cy,
                        rScale.map(d.value),
                        0,
                        start + pad,
                        start + band.bandwidth - pad,
                      )}
                      fill={d.color ?? COLORS[i % COLORS.length]!}
                      fillOpacity={0.85}
                      data-wedge=""
                    />
                  )
                })
              : (() => {
                  const closed = [...linePts, linePts[0]!]
                  const color = data[0]?.color ?? COLORS[0]!
                  return (
                    <>
                      {mode === 'area' && (
                        <path
                          d={`${linePath(closed, 'linear')}Z`}
                          fill={color}
                          fillOpacity={0.25}
                          stroke="none"
                          data-area=""
                        />
                      )}
                      <path
                        d={linePath(closed, 'linear')}
                        fill="none"
                        stroke={color}
                        strokeWidth={2}
                        data-polyline=""
                      />
                    </>
                  )
                })()}
            {/* angular labels */}
            {!plain &&
              data.map((d, i) => {
                const a = band.center(d.label) ?? 0
                const [lx, ly] = polarPoint(cx, cy, outerR + 12, a)
                return (
                  <text
                    key={i}
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="0.75rem"
                    fill="var(--cascivo-color-foreground-muted)"
                    data-angle-label=""
                  >
                    {d.label}
                  </text>
                )
              })}
          </g>
        )
      }}
    </ChartFrame>
  )
}
