'use client'
import type { LinearScale } from '../engine/scale'

export interface GridLinesProps {
  scale: LinearScale
  orientation: 'x' | 'y'
  length: number
  tickCount?: number
  transform?: string
}

export function GridLines({
  scale,
  orientation,
  length,
  tickCount = 5,
  transform,
}: GridLinesProps) {
  const ticks = scale.ticks(tickCount)
  const isX = orientation === 'x'
  return (
    <g transform={transform} aria-hidden="true">
      {ticks.map((v) => {
        const pos = scale.map(v)
        return (
          <line
            key={v}
            x1={isX ? pos : 0}
            y1={isX ? 0 : pos}
            x2={isX ? pos : length}
            y2={isX ? length : pos}
            stroke="var(--cascade-chart-grid)"
            strokeWidth={1}
            strokeDasharray="2 4"
          />
        )
      })}
    </g>
  )
}
