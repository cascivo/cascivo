'use client'
import { useSignals } from '@cascivo/core'
import { ChartFrame } from '../../core/chart-frame'
import { linearScale } from '../../engine/scale'
import type { TooltipModel } from '../../core/data-point'

export interface BulletProps {
  value: number
  target: number
  ranges: number[]
  label: string
  min?: number
  max?: number
  width?: number
  height?: number
  className?: string
}

const RANGE_COLORS = [
  'var(--cascivo-color-neutral-200)',
  'var(--cascivo-color-neutral-300)',
  'var(--cascivo-color-neutral-400)',
]

export function Bullet({
  value,
  target,
  ranges,
  label,
  min = 0,
  max,
  width = 300,
  height = 40,
  className,
}: BulletProps) {
  useSignals()

  const sortedRanges = [...ranges].sort((a, b) => a - b)
  const domainMax =
    max ?? sortedRanges[sortedRanges.length - 1] ?? (Math.max(value, target) * 1.2 || 1)
  const scale = linearScale([min, domainMax], [0, width])

  const barH = height * 0.35
  const barY = (height - barH) / 2
  const targetH = height * 0.7
  const targetY = (height - targetH) / 2

  const buildTooltip = (): TooltipModel => ({
    points: [
      {
        id: 'measure',
        cx: scale.map(value),
        cy: height / 2,
        label,
        value,
      },
    ],
  })

  return (
    <figure
      className={className}
      aria-label={`${label}: value ${value}, target ${target}`}
      style={{ margin: 0 }}
    >
      <ChartFrame
        title={`${label} bullet chart`}
        width={width}
        height={height}
        plain
        tooltip={buildTooltip()}
      >
        {() => (
          <>
            {/* Range bands */}
            {sortedRanges.map((r, i) => {
              const prev = i === 0 ? min : (sortedRanges[i - 1] ?? min)
              const bandW = scale.map(r) - scale.map(prev)
              return (
                <rect
                  key={i}
                  x={scale.map(prev)}
                  y={0}
                  width={Math.max(0, bandW)}
                  height={height}
                  fill={RANGE_COLORS[i % RANGE_COLORS.length] ?? 'var(--cascivo-color-neutral-200)'}
                />
              )
            })}
            {/* Measure bar */}
            <rect
              x={scale.map(min)}
              y={barY}
              width={Math.max(0, scale.map(value) - scale.map(min))}
              height={barH}
              fill="var(--cascivo-chart-1)"
            />
            {/* Target tick */}
            <line
              x1={scale.map(target)}
              y1={targetY}
              x2={scale.map(target)}
              y2={targetY + targetH}
              stroke="var(--cascivo-text-primary)"
              strokeWidth={2.5}
            />
          </>
        )}
      </ChartFrame>
      <figcaption style={{ fontSize: 12 }}>{label}</figcaption>
    </figure>
  )
}
