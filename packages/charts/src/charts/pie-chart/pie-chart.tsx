'use client'
import { useSignal, useSignals } from '@cascade-ui/core'
import { ChartFrame } from '../../core/chart-frame'
import { Legend } from '../../chrome/legend'
import { arcPath } from '../../engine/shape'

export interface PieChartDatum {
  id: string
  label: string
  value: number
  color?: string
}

export interface PieChartProps {
  data: readonly PieChartDatum[]
  title: string
  description?: string
  donut?: boolean
  width?: number
  height?: number
  legend?: boolean
  className?: string
  /** Render only the marks — no legend. For micro/inline charts. */
  plain?: boolean
}

const COLORS = Array.from({ length: 8 }, (_, i) => `var(--cascade-chart-${i + 1})`)

export function PieChart({
  data,
  title,
  description,
  donut = false,
  width: fixedWidth,
  height,
  legend,
  className,
  plain,
}: PieChartProps) {
  const resolvedHeight = height ?? (plain ? 48 : 300)
  const showLegend = plain ? false : (legend ?? true)
  useSignals()
  const hidden = useSignal(new Set<string>())
  const hasData = data.length > 0

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
        width={fixedWidth}
        height={resolvedHeight}
        fallback={fallback}
        className={className}
        data-state={hasData ? undefined : 'empty'}
        plain={plain}
      >
        {({ width, height: h }) => {
          const cx = width / 2
          const cy = h / 2
          const outerR = Math.min(cx, cy) - 8
          const innerR = donut ? outerR * 0.6 : 0

          const visible = data.filter((d) => !hidden.value.has(d.id))
          const total = visible.reduce((s, d) => s + d.value, 0)
          // arcPath uses sin/cos with 0 at top, so startAngle=0 → top (12 o'clock)
          let startAngle = 0

          return (
            <g>
              {visible.map((d, i) => {
                const slice = total > 0 ? (d.value / total) * 2 * Math.PI : 0
                const endAngle = startAngle + slice
                const color = d.color ?? COLORS[i % COLORS.length]!
                const path = arcPath(cx, cy, outerR, innerR, startAngle, endAngle)
                startAngle = endAngle
                return (
                  <path
                    key={d.id}
                    d={path}
                    fill={color}
                    stroke="var(--cascade-color-surface)"
                    strokeWidth={1}
                    data-series={d.id}
                  />
                )
              })}
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
