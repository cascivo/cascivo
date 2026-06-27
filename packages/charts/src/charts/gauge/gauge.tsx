'use client'
import { useSignals } from '@cascivo/core'
import { ChartFrame } from '../../core/chart-frame'
import { arcPath } from '../../engine/shape'
import { polarPoint } from '../../engine/polar'

export interface GaugeThreshold {
  /** Upper bound of this coloured zone (in value units). */
  upTo: number
  color: string
}

export interface GaugeProps {
  value: number
  min?: number
  max?: number
  /** Coloured zones from `min` upward; the last should reach `max`. */
  thresholds?: readonly GaugeThreshold[]
  /** Unit suffix shown after the centre value. */
  unit?: string
  /** Total sweep in degrees (default 270 — a speedometer arc). */
  sweep?: number
  /** Major tick count (labels at min…max). */
  ticks?: number
  title: string
  description?: string
  width?: number
  height?: number
  className?: string
  plain?: boolean
}

const DEG = Math.PI / 180

export function Gauge({
  value,
  min = 0,
  max = 100,
  thresholds,
  unit = '',
  sweep = 270,
  ticks = 5,
  title,
  description,
  width: fixedWidth,
  height,
  className,
  plain,
}: GaugeProps) {
  useSignals()
  const resolvedHeight = height ?? 240
  const span = max - min || 1
  const clamped = Math.max(min, Math.min(max, value))
  const frac = (clamped - min) / span
  const sweepRad = sweep * DEG
  const startA = -sweepRad / 2
  const angleOf = (v: number) => startA + ((v - min) / span) * sweepRad

  const fallback = (
    <table>
      <caption>{title}</caption>
      <tbody>
        <tr>
          <th>Value</th>
          <td>
            {value}
            {unit}
          </td>
        </tr>
        <tr>
          <th>Range</th>
          <td>
            {min}–{max}
          </td>
        </tr>
      </tbody>
    </table>
  )

  return (
    <ChartFrame
      title={title}
      description={description}
      width={fixedWidth}
      height={resolvedHeight}
      fallback={fallback}
      className={className}
      plain={plain}
    >
      {({ width: w, height: h }) => {
        const cx = w / 2
        const cy = h / 2
        const outerR = Math.max(0, Math.min(w, h) / 2 - (plain ? 6 : 24))
        const bandW = Math.max(6, outerR * 0.18)
        const innerR = outerR - bandW
        const needleR = innerR - 4

        const zones =
          thresholds && thresholds.length > 0
            ? thresholds
            : [{ upTo: clamped, color: 'var(--cascivo-color-accent)' }]
        let prev = min

        const tickVals = Array.from({ length: ticks + 1 }, (_, i) => min + (span * i) / ticks)

        return (
          <g>
            {/* track */}
            <path
              d={arcPath(cx, cy, outerR, innerR, startA, startA + sweepRad)}
              fill="var(--cascivo-chart-grid)"
              fillOpacity={0.25}
              data-track=""
            />
            {/* coloured zones (or the single value arc when no thresholds) */}
            {zones.map((z, i) => {
              const a0 = angleOf(prev)
              const a1 = angleOf(Math.min(max, z.upTo))
              prev = z.upTo
              return (
                <path
                  key={i}
                  d={arcPath(cx, cy, outerR, innerR, a0, a1)}
                  fill={z.color}
                  data-zone=""
                />
              )
            })}
            {/* ticks + labels */}
            {!plain &&
              tickVals.map((tv, i) => {
                const a = angleOf(tv)
                const [x1, y1] = polarPoint(cx, cy, innerR - 2, a)
                const [x2, y2] = polarPoint(cx, cy, innerR - 8, a)
                const [lx, ly] = polarPoint(cx, cy, innerR - 18, a)
                return (
                  <g key={i}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="var(--cascivo-color-foreground-muted)"
                      strokeWidth={1}
                      data-tick=""
                    />
                    <text
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="0.625rem"
                      fill="var(--cascivo-color-foreground-muted)"
                    >
                      {Math.round(tv)}
                    </text>
                  </g>
                )
              })}
            {/* needle */}
            {(() => {
              const a = angleOf(clamped)
              const [nx, ny] = polarPoint(cx, cy, needleR, a)
              return (
                <line
                  x1={cx}
                  y1={cy}
                  x2={nx}
                  y2={ny}
                  stroke="var(--cascivo-color-foreground)"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  data-needle=""
                  data-frac={frac.toFixed(3)}
                />
              )
            })()}
            <circle
              cx={cx}
              cy={cy}
              r={Math.max(3, bandW * 0.25)}
              fill="var(--cascivo-color-foreground)"
            />
            {/* centre readout */}
            <text
              x={cx}
              y={cy + outerR * 0.5}
              textAnchor="middle"
              fontSize="1.25rem"
              fontWeight={600}
              fill="var(--cascivo-color-foreground)"
              data-readout=""
            >
              {value}
              {unit}
            </text>
          </g>
        )
      }}
    </ChartFrame>
  )
}
