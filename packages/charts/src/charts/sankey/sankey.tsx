'use client'
import { useSignals } from '@cascivo/core'
import { ChartFrame } from '../../core/chart-frame'
import { DEFAULT_MARGINS, PLAIN_MARGINS } from '../../core/use-chart'
import { sankeyLayout, linkPath, type SankeyNode, type SankeyLink } from '../../engine/sankey'
import type { ChartPoint, TooltipModel } from '../../core/data-point'

export type { SankeyNode, SankeyLink } from '../../engine/sankey'

export interface SankeyProps {
  nodes: readonly SankeyNode[]
  links: readonly SankeyLink[]
  title: string
  description?: string
  width?: number
  height?: number
  tooltip?: boolean
  className?: string
  plain?: boolean
}

const COLORS = Array.from({ length: 8 }, (_, i) => `var(--cascivo-chart-${i + 1})`)

/** A Sankey flow diagram — ranked nodes with throughput-sized link ribbons. */
export function Sankey({
  nodes,
  links,
  title,
  description,
  width: fixedWidth,
  height,
  tooltip,
  className,
  plain,
}: SankeyProps) {
  useSignals()
  const margins = plain ? PLAIN_MARGINS : DEFAULT_MARGINS
  const resolvedHeight = height ?? (plain ? 48 : 320)
  const hasData = nodes.length > 0 && links.length > 0

  const colorOf = (id: string, i: number) =>
    nodes.find((n) => n.id === id)?.color ?? COLORS[i % COLORS.length]!

  const fallback = (
    <table>
      <caption>{title}</caption>
      <thead>
        <tr>
          <th>From</th>
          <th>To</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {links.map((l, i) => (
          <tr key={i}>
            <td>{nodes.find((n) => n.id === l.source)?.label ?? l.source}</td>
            <td>{nodes.find((n) => n.id === l.target)?.label ?? l.target}</td>
            <td>{l.value}</td>
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
    const innerW = w - margins.left - margins.right
    const innerH = h - margins.top - margins.bottom
    const { nodes: laid } = sankeyLayout(nodes, links, { width: innerW, height: innerH })
    const points: ChartPoint[] = laid.map((n, i) => ({
      id: n.id,
      cx: margins.left + (n.x0 + n.x1) / 2,
      cy: margins.top + (n.y0 + n.y1) / 2,
      label: n.label,
      value: n.value,
      color: colorOf(n.id, i),
    }))
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
      data-state={hasData ? undefined : 'empty'}
      plain={plain}
      tooltip={tooltip && hasData ? buildTooltip : undefined}
    >
      {({ width, height: h }) => {
        const innerW = width - margins.left - margins.right
        const innerH = h - margins.top - margins.bottom
        if (innerW <= 0 || !hasData) return null
        const { nodes: laid, links: laidLinks } = sankeyLayout(nodes, links, {
          width: innerW,
          height: innerH,
        })
        return (
          <g transform={`translate(${margins.left},${margins.top})`}>
            {laidLinks.map((l, i) => (
              <path
                key={i}
                d={linkPath(l)}
                fill={colorOf(l.source.id, laid.indexOf(l.source))}
                fillOpacity={0.32}
                data-link=""
              />
            ))}
            {laid.map((n, i) => (
              <g key={n.id} data-node={n.id}>
                <rect
                  x={n.x0}
                  y={n.y0}
                  width={n.x1 - n.x0}
                  height={Math.max(1, n.y1 - n.y0)}
                  fill={colorOf(n.id, i)}
                  rx={1}
                />
                {!plain && (
                  <text
                    x={n.x0 < innerW / 2 ? n.x1 + 4 : n.x0 - 4}
                    y={(n.y0 + n.y1) / 2}
                    dominantBaseline="central"
                    textAnchor={n.x0 < innerW / 2 ? 'start' : 'end'}
                    fontSize="0.6875rem"
                    fill="var(--cascivo-color-foreground)"
                  >
                    {n.label}
                  </text>
                )}
              </g>
            ))}
          </g>
        )
      }}
    </ChartFrame>
  )
}
