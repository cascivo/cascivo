'use client'
import { useSignal, useSignals } from '@cascivo/core'
import type { ReactNode } from 'react'
import { ChartFrame } from '../../core/chart-frame'
import { Legend } from '../../chrome/legend'
import { DataLabel, resolveLabels, type LabelOptions } from '../../chrome/data-label'
import { arcPath, quantize } from '../../engine/shape'
import type { ChartPoint, TooltipModel } from '../../core/data-point'

export interface PieChartDatum {
  id: string
  label: string
  value: number
  /** CSS color overriding the positional palette for this slice. */
  color?: string
}

export interface PieChartProps {
  data: readonly PieChartDatum[]
  title: string
  description?: string
  donut?: boolean
  width?: number
  height?: number
  /** Square shorthand: sets width === height. Explicit width/height win. */
  size?: number
  /** Donut ring width in px. Defaults to 0.4 × radius (innerRadius = 0.6 × radius). */
  thickness?: number
  /** Donut inner radius in px. Takes precedence over `thickness`. Clamped to [0, outerRadius). */
  innerRadius?: number
  /** Center value text rendered in the donut hole (donut only). */
  centerValue?: string
  /** Center label text rendered below the value in the donut hole (donut only). */
  centerLabel?: string
  /** Arbitrary content rendered in the donut hole; takes precedence over centerValue/centerLabel. */
  centerSlot?: ReactNode
  /** Visible placeholder text when data is empty. Defaults to the i18n built-in ("No data"). */
  emptyLabel?: string
  /** Custom tooltip formatter. Defaults to "value (pct%)". Receives ChartPoint.percent. */
  tooltipFormat?: (p: ChartPoint) => string
  legend?: boolean
  className?: string
  /** Render only the marks — no legend. For micro/inline charts. */
  plain?: boolean
  /** Label each slice. Defaults to its percentage; pass `{ format }` to show the value instead. */
  labels?: LabelOptions
  /** Fired when a point is clicked or activated (Enter/Space) — for drill-down. */
  onSelect?: (point: ChartPoint) => void
}

function pieDefaultFormat(p: ChartPoint): string {
  const pct = p.percent != null ? Math.round(p.percent) : 0
  return `${p.value} (${pct}%)`
}

const COLORS = Array.from({ length: 8 }, (_, i) => `var(--cascivo-chart-${i + 1})`)

export function PieChart({
  data,
  title,
  description,
  donut = false,
  width: fixedWidth,
  height,
  size,
  thickness,
  innerRadius,
  centerValue,
  centerLabel,
  centerSlot,
  emptyLabel,
  tooltipFormat,
  legend,
  className,
  plain,
  labels,
  onSelect,
}: PieChartProps) {
  const resolvedLabels = plain ? null : resolveLabels(labels)
  const labelsCustom = typeof labels === 'object' && labels !== null && labels.format != null
  const resolvedWidth = fixedWidth ?? size
  const resolvedHeight = height ?? size ?? (plain ? 48 : 300)
  const showLegend = plain ? false : (legend ?? true)
  useSignals()
  const hidden = useSignal(new Set<string>())
  const hasData = data.length > 0

  const buildTooltip = ({
    width: w,
    height: h,
  }: {
    width: number
    height: number
  }): TooltipModel | undefined => {
    if (!hasData) return undefined
    const chartCx = w / 2
    const chartCy = h / 2
    const outerR = Math.min(chartCx, chartCy) - 8
    const visible = data.filter((d) => !hidden.value.has(d.id))
    const total = visible.reduce((s, d) => s + d.value, 0)
    let startAngle = 0
    const points: ChartPoint[] = visible.map((d, i) => {
      const slice = total > 0 ? (d.value / total) * 2 * Math.PI : 0
      const endAngle = startAngle + slice
      const midAngle = (startAngle + endAngle) / 2
      startAngle = endAngle
      // arcPath uses sin for x, -cos for y (0 = top, clockwise)
      return {
        id: d.id,
        cx: quantize(chartCx + Math.sin(midAngle) * outerR * 0.65),
        cy: quantize(chartCy - Math.cos(midAngle) * outerR * 0.65),
        label: d.label,
        value: d.value,
        seriesId: String(i),
        percent: total > 0 ? (d.value / total) * 100 : 0,
        color: d.color ?? COLORS[i % COLORS.length]!,
      }
    })
    return { points, format: tooltipFormat ?? pieDefaultFormat }
  }

  const fallback = (
    <table>
      <caption>{title}</caption>
      <thead>
        <tr>
          <th>Label</th>
          <th>Value</th>
          <th>Percent</th>
        </tr>
      </thead>
      <tbody>
        {data.map((d) => {
          const total = data.reduce((s, v) => s + v.value, 0)
          const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0'
          return (
            <tr key={d.id}>
              <td>{d.label}</td>
              <td>{d.value}</td>
              <td>{pct}%</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )

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
        emptyLabel={emptyLabel}
        plain={plain}
        tooltip={hasData ? buildTooltip : undefined}
        onSelect={onSelect}
      >
        {({ width, height: h }) => {
          const cx = width / 2
          const cy = h / 2
          const outerR = Math.min(cx, cy) - 8
          // Resolve the donut inner radius: innerRadius wins, then thickness,
          // else today's 0.6 ratio. Clamp to [0, outerR) to avoid an inverted arc.
          const rawInner =
            innerRadius != null
              ? innerRadius
              : thickness != null
                ? outerR - thickness
                : outerR * 0.6
          const innerR = donut ? Math.max(0, Math.min(rawInner, outerR)) : 0

          const visible = data.filter((d) => !hidden.value.has(d.id))
          const total = visible.reduce((s, d) => s + d.value, 0)
          // arcPath uses sin/cos with 0 at top, so startAngle=0 → top (12 o'clock)
          let startAngle = 0

          const showCenter =
            donut && (centerValue != null || centerLabel != null || centerSlot != null)

          return (
            <g>
              {visible.map((d, i) => {
                const slice = total > 0 ? (d.value / total) * 2 * Math.PI : 0
                const endAngle = startAngle + slice
                const midAngle = (startAngle + endAngle) / 2
                const color = d.color ?? COLORS[i % COLORS.length]!
                const path = arcPath(cx, cy, outerR, innerR, startAngle, endAngle)
                startAngle = endAngle
                const pct = total > 0 ? (d.value / total) * 100 : 0
                // Skip labels on slices too thin to hold readable text.
                const showLabel = resolvedLabels && pct >= 4
                const labelR = innerR > 0 ? (innerR + outerR) / 2 : outerR * 0.6
                return (
                  <g key={d.id}>
                    <path
                      d={path}
                      fill={color}
                      stroke="var(--cascivo-color-surface)"
                      strokeWidth={1}
                      data-series={d.id}
                    />
                    {showLabel && (
                      <DataLabel
                        x={quantize(cx + Math.sin(midAngle) * labelR)}
                        y={quantize(cy - Math.cos(midAngle) * labelR + 4)}
                        text={labelsCustom ? resolvedLabels.format(d.value) : `${Math.round(pct)}%`}
                        tone="muted"
                      />
                    )}
                  </g>
                )
              })}
              {showCenter &&
                (centerSlot != null ? (
                  <foreignObject
                    x={cx - innerR}
                    y={cy - innerR}
                    width={innerR * 2}
                    height={innerR * 2}
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
