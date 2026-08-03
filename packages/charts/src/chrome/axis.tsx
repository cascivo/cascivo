'use client'
import { AXIS_CHAR_PX } from '../core/use-chart'
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
  /**
   * `x` — horizontal axis, labels below the line.
   * `y` — vertical axis on the **left**, labels outside to the left.
   * `y-right` — vertical axis on the **right**, labels outside to the right.
   *
   * A right-hand axis MUST use `y-right`: a `y` axis translated to the plot's right edge
   * draws its labels at `x: -8` with `text-anchor: end`, i.e. *inside the plot*, on top of
   * the marks. That was the actual rendering of every right axis in the catalog.
   */
  orientation: 'x' | 'y' | 'y-right'
  length: number
  format?: (value: number | string | Date) => string
  tickCount?: number
  /**
   * For band scales: render every Nth category label to avoid crowding. The final label is
   * always drawn, and a strided label that would collide with it is dropped —
   * see `autoLabelStride`, which computes this for you. Pass explicitly only to override.
   */
  labelEvery?: number | undefined
  /**
   * Axis title, drawn outside the tick labels — rotated for a vertical axis.
   *
   * On a dual-axis chart this is the whole mechanism for saying which series belongs to
   * which scale. `secondAxis.label` was typed on `AreaChart`/`LineChart` for months and
   * rendered nothing, so a two-series chart was unreadable without a legend workaround.
   */
  title?: string | undefined
  /**
   * Distance from the axis line to the title, in px. Should clear the widest tick label;
   * callers already compute that width for their margins.
   *
   * @defaultValue `36`
   */
  titleOffset?: number | undefined
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
  labelEvery,
  title,
  titleOffset = 36,
  transform,
}: AxisProps) {
  let ticks: Array<{ position: number; label: string }>

  if (isBand(scale)) {
    const last = scale.domain.length - 1
    const strided = labelEvery != null && labelEvery > 1
    // The last strided index before the always-drawn final label. When the stride doesn't
    // divide `last` evenly these two can land close enough to overprint each other
    // (30 categories at stride 4 → …24, 28, 29 → "Jul 21 JulJ2526").
    //
    // The test is in PIXELS, not indices: four wide bands at stride 2 leave plenty of room
    // between index 2 and index 3, while thirty narrow ones do not. Comparing index
    // distance instead would drop a label that fits perfectly well.
    const penultimate = strided ? Math.floor(last / labelEvery) * labelEvery : -1
    let dropPenultimate = false
    if (strided && penultimate !== last && penultimate >= 0) {
      const posOf = (i: number) => (scale.map(scale.domain[i]!) ?? 0) + scale.bandwidth / 2
      const widest = scale.domain.reduce((m, d) => Math.max(m, format(d).length), 0) * AXIS_CHAR_PX
      dropPenultimate = posOf(last) - posOf(penultimate) < widest
    }
    ticks = scale.domain
      .map((d, i) => ({
        position: (scale.map(d) ?? 0) + scale.bandwidth / 2,
        label: format(d),
        i,
      }))
      // Thin labels for crowded categorical axes: keep every Nth and always the last.
      .filter(({ i }) => {
        if (!strided) return true
        if (i === last) return true
        if (dropPenultimate && i === penultimate) return false
        return i % labelEvery === 0
      })
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
  const isRight = orientation === 'y-right'
  // Tick mark and label sit on the outside of the plot: left for `y`, right for `y-right`.
  const tickX = isX ? 0 : isRight ? 4 : -4
  const labelX = isX ? 0 : isRight ? 8 : -8
  const anchor = isX ? 'middle' : isRight ? 'start' : 'end'
  return (
    <g transform={transform} aria-hidden="true">
      <line
        x1={0}
        y1={0}
        x2={isX ? length : 0}
        y2={isX ? 0 : length}
        stroke="var(--cascivo-chart-axis)"
        strokeWidth={1}
      />
      {ticks.map(({ position, label }, i) => (
        <g key={i} transform={isX ? `translate(${position},0)` : `translate(0,${position})`}>
          <line
            x1={0}
            y1={0}
            x2={tickX}
            y2={isX ? 4 : 0}
            stroke="var(--cascivo-chart-axis)"
            strokeWidth={1}
          />
          <text
            x={labelX}
            y={isX ? 16 : 4}
            textAnchor={anchor}
            fill="var(--cascivo-chart-axis)"
            fontSize={11}
          >
            {label}
          </text>
        </g>
      ))}
      {title !== undefined &&
        title !== '' && (
          // Vertical axes rotate their title to run along the axis; `y` reads bottom-to-top
          // and `y-right` top-to-bottom, which is the convention both d3 and Excel use.
          <text
            transform={
              isX
                ? `translate(${length / 2},${titleOffset})`
                : `translate(${isRight ? titleOffset : -titleOffset},${length / 2}) rotate(${isRight ? 90 : -90})`
            }
            textAnchor="middle"
            fill="var(--cascivo-chart-axis)"
            fontSize={11}
            fontWeight={500}
          >
            {title}
          </text>
        )}
    </g>
  )
}
