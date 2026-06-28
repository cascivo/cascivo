'use client'
import { useSignal, useSignals } from '@cascivo/core'
import type { ReactNode } from 'react'
import { ChartFrame } from '../../core/chart-frame'
import { Legend } from '../../chrome/legend'
import { arcPath } from '../../engine/shape'
import type { ChartPoint, TooltipModel } from '../../core/data-point'

export interface RadialBarDatum {
  id: string
  label: string
  value: number
  /** CSS color overriding the positional palette for this ring. */
  color?: string
}

export interface RadialBarProps {
  data: readonly RadialBarDatum[]
  title: string
  description?: string
  /** Square shorthand: sets width === height. Explicit width/height win. */
  size?: number
  width?: number
  height?: number
  /** Domain top — the value a full sweep represents. Defaults to the largest datum. */
  max?: number
  /** Sweep angle in degrees (default 270 — a gauge arc). */
  sweep?: number
  /** Center value text rendered in the hole. */
  centerValue?: string
  /** Center label text rendered below the value. */
  centerLabel?: string
  /** Arbitrary content rendered in the hole; takes precedence over centerValue/centerLabel. */
  centerSlot?: ReactNode
  tooltip?: boolean
  legend?: boolean
  className?: string
  /** Render only the marks — no legend. For micro/inline charts. */
  plain?: boolean
}

const COLORS = Array.from({ length: 8 }, (_, i) => `var(--cascivo-chart-${i + 1})`)

/**
 * Concentric radial bars — a circular gauge family. Each datum is a ring whose
 * filled sweep is proportional to its value over `max`. Reuses the pie arc math.
 */
export function RadialBar({
  data,
  title,
  description,
  size,
  width: fixedWidth,
  height,
  max,
  sweep = 270,
  centerValue,
  centerLabel,
  centerSlot,
  tooltip,
  legend,
  className,
  plain,
}: RadialBarProps) {
  useSignals()
  const hidden = useSignal(new Set<string>())
  const resolvedWidth = fixedWidth ?? size
  const resolvedHeight = height ?? size ?? (plain ? 48 : 300)
  const showLegend = plain ? false : (legend ?? data.length > 1)
  const hasData = data.length > 0

  const domainMax = max ?? Math.max(1, ...data.map((d) => d.value))
  const sweepRad = (Math.min(360, Math.max(0, sweep)) * Math.PI) / 180
  // Center the sweep on the top (12 o'clock); 0 rad = top in arcPath.
  const startAngle = -sweepRad / 2

  /** Geometry for one ring (outer→inner radius), shared by render + tooltip. */
  const ringGeometry = (w: number, h: number) => {
    const cx = w / 2
    const cy = h / 2
    const maxR = Math.min(cx, cy) - 8
    const holeR = maxR * 0.32
    const visible = data.filter((d) => !hidden.value.has(d.id))
    const span = visible.length > 0 ? (maxR - holeR) / visible.length : 0
    return { cx, cy, maxR, holeR, span, visible }
  }

  const buildTooltip = ({
    width: w,
    height: h,
  }: {
    width: number
    height: number
  }): TooltipModel | undefined => {
    if (tooltip === false || !hasData) return undefined
    const { cx, cy, maxR, span, visible } = ringGeometry(w, h)
    const points: ChartPoint[] = visible.map((d, i) => {
      const outerR = maxR - i * span
      const innerR = outerR - span * 0.7
      const midR = (outerR + innerR) / 2
      const endAngle = startAngle + sweepRad * Math.min(1, d.value / domainMax)
      return {
        id: d.id,
        cx: cx + Math.sin(endAngle) * midR,
        cy: cy - Math.cos(endAngle) * midR,
        label: d.label,
        value: d.value,
        seriesId: d.id,
        percent: domainMax > 0 ? (d.value / domainMax) * 100 : 0,
        color: d.color ?? COLORS[i % COLORS.length]!,
      }
    })
    return { points }
  }

  const fallback = (
    <table>
      <caption>{title}</caption>
      <thead>
        <tr>
          <th>Label</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {data.map((d) => (
          <tr key={d.id}>
            <td>{d.label}</td>
            <td>{d.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  const showCenter = centerValue != null || centerLabel != null || centerSlot != null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <ChartFrame
        title={title}
        description={description}
        width={resolvedWidth}
        height={resolvedHeight}
        fallback={fallback}
        className={className}
        data-state={hasData ? undefined : 'empty'}
        plain={plain}
        tooltip={tooltip !== false && hasData ? buildTooltip : undefined}
      >
        {({ width, height: h }) => {
          const { cx, cy, maxR, holeR, span, visible } = ringGeometry(width, h)
          return (
            <g>
              {visible.map((d, i) => {
                const outerR = maxR - i * span
                const innerR = outerR - span * 0.7
                const color = d.color ?? COLORS[i % COLORS.length]!
                const frac = Math.max(0, Math.min(1, d.value / domainMax))
                const endAngle = startAngle + sweepRad * frac
                return (
                  <g key={d.id} data-series={d.id}>
                    {/* faint full-sweep track */}
                    <path
                      d={arcPath(cx, cy, outerR, innerR, startAngle, startAngle + sweepRad)}
                      fill="var(--cascivo-chart-grid)"
                      fillOpacity={0.35}
                    />
                    {/* value arc */}
                    {frac > 0 && (
                      <path
                        d={arcPath(cx, cy, outerR, innerR, startAngle, endAngle)}
                        fill={color}
                      />
                    )}
                  </g>
                )
              })}
              {!plain &&
                showCenter &&
                (centerSlot != null ? (
                  <foreignObject
                    x={cx - holeR}
                    y={cy - holeR}
                    width={holeR * 2}
                    height={holeR * 2}
                    data-center-slot=""
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                      }}
                    >
                      {centerSlot}
                    </div>
                  </foreignObject>
                ) : (
                  <g data-center="">
                    {centerValue != null && (
                      <text
                        x={cx}
                        y={centerLabel != null ? cy - 8 : cy}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="1.5rem"
                        fontWeight={700}
                        fill="var(--cascivo-color-foreground)"
                      >
                        {centerValue}
                      </text>
                    )}
                    {centerLabel != null && (
                      <text
                        x={cx}
                        y={centerValue != null ? cy + 14 : cy}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="0.8125rem"
                        fill="var(--cascivo-color-foreground-muted)"
                      >
                        {centerLabel}
                      </text>
                    )}
                  </g>
                ))}
            </g>
          )
        }}
      </ChartFrame>
      {showLegend && (
        <Legend
          series={data.map((d, i) => ({
            id: d.id,
            label: d.label,
            color: d.color ?? COLORS[i % COLORS.length]!,
          }))}
          hidden={hidden}
        />
      )}
    </div>
  )
}
