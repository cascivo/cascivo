'use client'
import type { BandScale, LinearScale } from '../engine/scale'
import type { LogScale } from '../engine/scale-log'
import type { TimeScale } from '../engine/scale-time'

type AnyScale = LinearScale | BandScale | LogScale | TimeScale

function isBand(s: AnyScale): s is BandScale {
  return 'bandwidth' in s
}
function isTime(s: AnyScale): s is TimeScale {
  return 'tickInterval' in s
}

export interface AxisProps {
  scale: AnyScale
  orientation: 'x' | 'y'
  length: number
  format?: (value: number | string | Date) => string
  tickCount?: number
  transform?: string
}

function defaultFormat(value: number | string | Date): string {
  if (value instanceof Date) return value.toLocaleDateString()
  if (typeof value === 'number') return value.toLocaleString()
  return String(value)
}

export function Axis({
  scale,
  orientation,
  length,
  format = defaultFormat,
  tickCount = 5,
  transform,
}: AxisProps) {
  let ticks: Array<{ position: number; label: string }>

  if (isBand(scale)) {
    ticks = scale.domain.map((d) => ({
      position: (scale.map(d) ?? 0) + scale.bandwidth / 2,
      label: format(d),
    }))
  } else if (isTime(scale)) {
    ticks = scale.ticks(tickCount).map((d) => ({
      position: scale.map(d),
      label: format(d),
    }))
  } else {
    const s = scale as LinearScale | LogScale
    ticks = s.ticks(tickCount).map((v) => ({
      position: s.map(v),
      label: format(v as number),
    }))
  }

  const isX = orientation === 'x'
  return (
    <g transform={transform} aria-hidden="true">
      <line
        x1={0}
        y1={0}
        x2={isX ? length : 0}
        y2={isX ? 0 : length}
        stroke="var(--cascade-chart-axis)"
        strokeWidth={1}
      />
      {ticks.map(({ position, label }, i) => (
        <g key={i} transform={isX ? `translate(${position},0)` : `translate(0,${position})`}>
          <line
            x1={0}
            y1={0}
            x2={isX ? 0 : -4}
            y2={isX ? 4 : 0}
            stroke="var(--cascade-chart-axis)"
            strokeWidth={1}
          />
          <text
            x={isX ? 0 : -8}
            y={isX ? 16 : 4}
            textAnchor={isX ? 'middle' : 'end'}
            fill="var(--cascade-chart-axis)"
            fontSize={11}
          >
            {label}
          </text>
        </g>
      ))}
    </g>
  )
}
