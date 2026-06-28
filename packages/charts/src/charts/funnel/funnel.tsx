'use client'
import { useSignals } from '@cascivo/core'
import { ChartFrame } from '../../core/chart-frame'
import { DEFAULT_MARGINS, PLAIN_MARGINS } from '../../core/use-chart'
import { DataLabel } from '../../chrome/data-label'
import { linearScale } from '../../engine/scale'
import type { ChartPoint, TooltipModel } from '../../core/data-point'

export interface FunnelStage {
  id: string
  label: string
  value: number
  /** CSS color overriding the positional palette for this stage. */
  color?: string
}

export interface FunnelProps {
  data: readonly FunnelStage[]
  title: string
  description?: string
  width?: number
  height?: number
  /** Show per-stage conversion: value + % of the first stage. */
  showConversion?: boolean
  tooltip?: boolean
  className?: string
  /** Render only the marks — no labels. For micro/inline charts. */
  plain?: boolean
}

const COLORS = Array.from({ length: 8 }, (_, i) => `var(--cascivo-chart-${i + 1})`)

/**
 * A vertical funnel — each stage is a trapezoid whose top width is its value and
 * bottom width is the next stage's value, so the silhouette narrows down the
 * stages. Useful for conversion / drop-off flows.
 */
export function Funnel({
  data,
  title,
  description,
  width: fixedWidth,
  height,
  showConversion = false,
  tooltip,
  className,
  plain,
}: FunnelProps) {
  useSignals()
  const margins = plain ? PLAIN_MARGINS : DEFAULT_MARGINS
  const resolvedHeight = height ?? (plain ? 48 : 320)
  const hasData = data.length > 0
  const first = data[0]?.value ?? 0
  const domainMax = Math.max(1, ...data.map((d) => d.value))

  const fallback = (
    <table>
      <caption>{title}</caption>
      <thead>
        <tr>
          <th>Stage</th>
          <th>Value</th>
          <th>% of first</th>
        </tr>
      </thead>
      <tbody>
        {data.map((d) => (
          <tr key={d.id}>
            <td>{d.label}</td>
            <td>{d.value}</td>
            <td>{first > 0 ? Math.round((d.value / first) * 100) : 0}%</td>
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
    const stageH = innerH / data.length
    const points: ChartPoint[] = data.map((d, i) => ({
      id: d.id,
      cx: margins.left + innerW / 2,
      cy: margins.top + i * stageH + stageH / 2,
      label: d.label,
      value: d.value,
      seriesId: d.id,
      percent: first > 0 ? (d.value / first) * 100 : 0,
      color: d.color ?? COLORS[i % COLORS.length]!,
    }))
    return { points, format: (p) => `${p.label}: ${p.value} (${Math.round(p.percent ?? 0)}%)` }
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
      {({ width, height: h }) => {
        const innerW = width - margins.left - margins.right
        const innerH = h - margins.top - margins.bottom
        if (innerW <= 0 || data.length === 0) return null
        const stageH = innerH / data.length
        const wScale = linearScale([0, domainMax], [0, innerW])
        const half = (v: number) => wScale.map(v) / 2
        const midX = margins.left + innerW / 2

        return (
          <g>
            {data.map((d, i) => {
              const next = data[i + 1]
              const topHalf = half(d.value)
              const bottomHalf = half(next ? next.value : d.value)
              const yTop = margins.top + i * stageH
              const yBottom = yTop + stageH * (next ? 1 : 0.9)
              const color = d.color ?? COLORS[i % COLORS.length]!
              // trapezoid: top edge wider, bottom edge = next stage width
              const points = [
                [midX - topHalf, yTop],
                [midX + topHalf, yTop],
                [midX + bottomHalf, yBottom],
                [midX - bottomHalf, yBottom],
              ]
                .map((p) => p.join(','))
                .join(' ')
              const pct = first > 0 ? Math.round((d.value / first) * 100) : 0
              return (
                <g key={d.id} data-series={d.id}>
                  <polygon points={points} fill={color} fillOpacity={0.85} />
                  {!plain && (
                    <DataLabel
                      x={midX}
                      y={yTop + stageH / 2}
                      text={
                        showConversion
                          ? `${d.label} · ${d.value} (${pct}%)`
                          : `${d.label} · ${d.value}`
                      }
                      tone="muted"
                    />
                  )}
                </g>
              )
            })}
          </g>
        )
      }}
    </ChartFrame>
  )
}
