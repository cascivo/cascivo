'use client'
import { useId } from 'react'
import { useSignals } from '@cascade-ui/core'
import { ChartFrame } from '../../core/chart-frame'
import { squarify } from '../../engine/treemap'

export interface TreemapDatum {
  id: string
  label: string
  value: number
}

export interface TreemapProps {
  data: TreemapDatum[]
  title: string
  description?: string
  width?: number
  height?: number
  className?: string
  /** Render only the colored rects — no text labels. For micro/inline charts. */
  plain?: boolean
}

const COLORS = Array.from({ length: 8 }, (_, i) => `var(--cascade-chart-${i + 1})`)

export function Treemap({
  data,
  title,
  description,
  width: fixedWidth,
  height,
  className,
  plain,
}: TreemapProps) {
  useSignals()
  const clipId = useId()
  const resolvedHeight = height ?? (plain ? 48 : 320)

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
      {({ width, height: h }) => {
        if (data.length === 0) return null
        const rects = squarify(
          data.map((d) => ({ id: d.id, value: d.value })),
          width,
          h,
        )
        const labelMap = new Map(data.map((d) => [d.id, d.label]))

        return (
          <>
            <defs>
              {rects.map((r) => (
                <clipPath key={r.id} id={`${clipId}-${r.id}`}>
                  <rect
                    x={r.x + 2}
                    y={r.y + 2}
                    width={Math.max(0, r.w - 4)}
                    height={Math.max(0, r.h - 4)}
                  />
                </clipPath>
              ))}
            </defs>
            {rects.map((r, i) => {
              const color = COLORS[i % COLORS.length] ?? 'var(--cascade-chart-1)'
              const label = labelMap.get(r.id) ?? r.id
              return (
                <g key={r.id} aria-label={`${label}: ${data.find((d) => d.id === r.id)?.value}`}>
                  <rect
                    x={r.x}
                    y={r.y}
                    width={Math.max(0, r.w - 1)}
                    height={Math.max(0, r.h - 1)}
                    fill={color}
                    fillOpacity={0.8}
                    stroke="var(--cascade-surface-base)"
                    strokeWidth={1}
                  />
                  {!plain && r.w > 30 && r.h > 18 && (
                    <text
                      x={r.x + 4}
                      y={r.y + 14}
                      fontSize={Math.min(12, r.w / 5)}
                      fill="currentColor"
                      clipPath={`url(#${clipId}-${r.id})`}
                    >
                      {label}
                    </text>
                  )}
                </g>
              )
            })}
          </>
        )
      }}
    </ChartFrame>
  )
}
