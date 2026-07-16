'use client'
import { useSignals } from '@cascivo/core'
import { ChartFrame } from '../../core/chart-frame'
import type { ChartPoint, TooltipModel } from '../../core/data-point'
import { quantize } from '../../engine/shape'

export interface RadarSeries {
  id: string
  label: string
  values: number[]
}

export interface RadarProps {
  axes: string[]
  series: RadarSeries[]
  max?: number
  title: string
  description?: string
  width?: number
  height?: number
  className?: string
  /** Render only the data polygons — no rings, spokes, or axis labels. For micro/inline charts. */
  plain?: boolean
}

const COLORS = Array.from({ length: 8 }, (_, i) => `var(--cascivo-chart-${i + 1})`)
const RINGS = 4

function polarPoints(
  values: number[],
  maxVal: number,
  cx: number,
  cy: number,
  r: number,
): { x: number; y: number }[] {
  const n = values.length
  return values.map((v, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    const radius = (v / maxVal) * r
    return { x: quantize(cx + Math.cos(angle) * radius), y: quantize(cy + Math.sin(angle) * radius) }
  })
}

export function Radar({
  axes,
  series,
  max,
  title,
  description,
  width: fixedWidth,
  height,
  className,
  plain,
}: RadarProps) {
  const resolvedHeight = height ?? (plain ? 48 : 320)
  useSignals()

  const maxVal = max ?? Math.max(1, ...series.flatMap((s) => s.values))
  const n = axes.length

  const fallback = (
    <table>
      <caption>{title}</caption>
      <thead>
        <tr>
          <th>Series</th>
          {axes.map((a) => (
            <th key={a}>{a}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {series.map((s) => (
          <tr key={s.id}>
            <td>{s.label}</td>
            {s.values.map((v, i) => (
              <td key={i}>{v}</td>
            ))}
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
    if (series.length === 0 || n === 0) return undefined
    const cx = w / 2
    const cy = h / 2
    const r = Math.min(cx, cy) * 0.72

    const points: ChartPoint[] = series.flatMap((s) =>
      s.values.map((v, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2
        const radius = (v / maxVal) * r
        return {
          id: `${s.id}-${i}`,
          cx: quantize(cx + Math.cos(angle) * radius),
          cy: quantize(cy + Math.sin(angle) * radius),
          label: axes[i] ?? String(i),
          value: v,
          seriesId: s.id,
        }
      }),
    )
    return { points }
  }

  return (
    <ChartFrame
      title={title}
      description={description}
      width={fixedWidth}
      height={resolvedHeight}
      fallback={fallback}
      className={className}
      plain={plain}
      tooltip={series.length > 0 ? buildTooltip : undefined}
    >
      {({ width, height: h }) => {
        const cx = width / 2
        const cy = h / 2
        const r = Math.min(cx, cy) * 0.72

        // Grid rings
        const rings = Array.from({ length: RINGS }, (_, i) => ((i + 1) / RINGS) * r)

        // Spoke endpoints
        const spokeEnds = Array.from({ length: n }, (_, i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2
          return { x: quantize(cx + Math.cos(angle) * r), y: quantize(cy + Math.sin(angle) * r) }
        })

        // Ring polygons
        const ringPolygons = rings.map((ringR) => {
          const pts = Array.from({ length: n }, (_, i) => {
            const angle = (i / n) * 2 * Math.PI - Math.PI / 2
            return `${quantize(cx + Math.cos(angle) * ringR)},${quantize(cy + Math.sin(angle) * ringR)}`
          })
          return pts.join(' ')
        })

        return (
          <>
            {/* Rings */}
            {!plain &&
              ringPolygons.map((pts, i) => (
                <polygon
                  key={i}
                  points={pts}
                  fill="none"
                  stroke="var(--cascivo-border-subtle)"
                  strokeWidth={1}
                />
              ))}
            {/* Spokes */}
            {!plain &&
              spokeEnds.map((pt, i) => (
                <line
                  key={i}
                  x1={cx}
                  y1={cy}
                  x2={pt.x}
                  y2={pt.y}
                  stroke="var(--cascivo-border-subtle)"
                  strokeWidth={1}
                />
              ))}
            {/* Axis labels */}
            {!plain &&
              spokeEnds.map((pt, i) => {
                const angle = (i / n) * 2 * Math.PI - Math.PI / 2
                const lx = quantize(cx + Math.cos(angle) * (r + 18))
                const ly = quantize(cy + Math.sin(angle) * (r + 18))
                return (
                  <text
                    key={i}
                    x={lx}
                    y={ly}
                    fontSize={11}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="var(--cascivo-text-secondary)"
                  >
                    {axes[i]}
                  </text>
                )
              })}
            {/* Series polygons */}
            {series.map((s, si) => {
              const pts = polarPoints(s.values, maxVal, cx, cy, r)
              const polygon = pts.map((p) => `${p.x},${p.y}`).join(' ')
              const color = COLORS[si % COLORS.length] ?? 'var(--cascivo-chart-1)'
              return (
                <polygon
                  key={s.id}
                  points={polygon}
                  fill={color}
                  fillOpacity={0.15}
                  stroke={color}
                  strokeWidth={2}
                />
              )
            })}
          </>
        )
      }}
    </ChartFrame>
  )
}
