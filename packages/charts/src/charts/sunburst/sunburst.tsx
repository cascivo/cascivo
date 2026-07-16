'use client'
import { useSignals } from '@cascivo/core'
import { ChartFrame } from '../../core/chart-frame'
import { arcPath, quantize } from '../../engine/shape'
import { partition, maxDepth, sumValue, type HierNode } from '../../engine/hierarchy'
import type { ChartPoint, TooltipModel } from '../../core/data-point'

export type { HierNode } from '../../engine/hierarchy'

export interface SunburstProps {
  /** Root of the hierarchy. Leaves carry `value`; parents sum their children. */
  data: HierNode
  title: string
  description?: string
  size?: number
  width?: number
  height?: number
  tooltip?: boolean
  className?: string
  plain?: boolean
}

const COLORS = Array.from({ length: 8 }, (_, i) => `var(--cascivo-chart-${i + 1})`)

/** A sunburst — a radial partition of a tree; each node is an annular segment. */
export function Sunburst({
  data,
  title,
  description,
  size,
  width: fixedWidth,
  height,
  tooltip,
  className,
  plain,
}: SunburstProps) {
  useSignals()
  const resolvedWidth = fixedWidth ?? size
  const resolvedHeight = height ?? size ?? (plain ? 48 : 300)
  const total = sumValue(data)
  const hasData = total > 0

  const nodes = partition(data)
  const depth = Math.max(1, maxDepth(nodes))

  const fallback = (
    <table>
      <caption>{title}</caption>
      <thead>
        <tr>
          <th>Path</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {nodes
          .filter((n) => n.depth > 0)
          .map((n, i) => (
            <tr key={`${n.node.label}-${i}`}>
              <td>{n.node.label}</td>
              <td>{n.value}</td>
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
    if (!tooltip || !hasData) return undefined
    const cx = w / 2
    const cy = h / 2
    const maxR = Math.min(cx, cy) - 8
    const ring = maxR / depth
    const points: ChartPoint[] = nodes
      .filter((n) => n.depth > 0)
      .map((n, i) => {
        const mid = (n.a0 + n.a1) / 2
        const r = (n.depth - 0.5) * ring
        return {
          id: `${n.node.label}-${i}`,
          cx: quantize(cx + Math.sin(mid) * r),
          cy: quantize(cy - Math.cos(mid) * r),
          label: n.node.label,
          value: n.value,
          percent: total > 0 ? (n.value / total) * 100 : 0,
          color: n.node.color ?? COLORS[i % COLORS.length]!,
        }
      })
    return { points, format: (p) => `${p.label}: ${p.value} (${Math.round(p.percent ?? 0)}%)` }
  }

  return (
    <ChartFrame
      title={title}
      description={description}
      width={resolvedWidth}
      height={resolvedHeight}
      fallback={fallback}
      className={className}
      data-state={hasData ? undefined : 'empty'}
      plain={plain}
      tooltip={tooltip && hasData ? buildTooltip : undefined}
    >
      {({ width, height: h }) => {
        const cx = width / 2
        const cy = h / 2
        const maxR = Math.min(cx, cy) - 8
        const ring = maxR / depth
        return (
          <g>
            {nodes
              .filter((n) => n.depth > 0)
              .map((n, i) => {
                const innerR = (n.depth - 1) * ring
                const outerR = n.depth * ring
                const color = n.node.color ?? COLORS[i % COLORS.length]!
                return (
                  <path
                    key={`${n.node.label}-${i}`}
                    d={arcPath(cx, cy, outerR, innerR, n.a0, n.a1)}
                    fill={color}
                    fillOpacity={1 - (n.depth - 1) * 0.18}
                    stroke="var(--cascivo-color-surface)"
                    strokeWidth={1}
                    data-depth={n.depth}
                  />
                )
              })}
          </g>
        )
      }}
    </ChartFrame>
  )
}
