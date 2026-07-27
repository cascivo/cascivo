'use client'
import { useSignal, useSignals } from '@cascivo/core'
import { ChartFrame } from '../../core/chart-frame'
import { warnOnce, warnScaleMismatch } from '../../core/dev-warn'
import {
  autoLabelStride,
  DEFAULT_MARGINS,
  leftMarginForLabels,
  PLAIN_MARGINS,
  rightMarginForLabels,
} from '../../core/use-chart'
import { Axis } from '../../chrome/axis'
import { GridLines } from '../../chrome/grid-lines'
import { Legend } from '../../chrome/legend'
import { renderAnnotations, type Annotation } from '../../chrome/reference'
import { linearScale, bandScale } from '../../engine/scale'
import { linePath } from '../../engine/shape'
import type { ChartPoint, TooltipModel } from '../../core/data-point'

export interface ComboChartBar {
  label: string
  value: number
}

export interface ComboChartPoint {
  /** Index into `bars` — point `i` is drawn at the centre of bar `i`. */
  x: number
  y: number
}

export interface ComboChartProps {
  /** Bar series — one entry per category, in x order. */
  bars: ComboChartBar[]
  /**
   * Line series, correlated with `bars` **by array index**: `line[i]` is drawn over
   * `bars[i]`. Pass the same number of points as bars — a length mismatch is a data bug
   * and warns in dev.
   */
  line: ComboChartPoint[]
  title: string
  description?: string
  /** Measure the line on its own right-hand axis (use when the two metrics differ in scale). */
  secondAxis?: boolean
  /** Legend label for the bar series. Defaults to `'Bars'`. */
  barsLabel?: string
  /** Legend label for the line series. Defaults to `'Line'`. */
  lineLabel?: string
  /**
   * Show the legend. Defaults to **on** when both series have data — a two-metric chart
   * with nothing naming the two metrics is unreadable.
   */
  legend?: boolean
  /**
   * Render every Nth category label. **Omit this — it is auto-computed** from the label
   * widths and the plot width; pass it only to override the automatic stride.
   */
  xLabelEvery?: number
  /**
   * Fixed SVG width in px. ⚠ **Omit for a responsive chart** — the chart fills and tracks
   * its container via a ResizeObserver; there is no correct pixel number in a responsive
   * grid. A fixed width is clamped to the container (max-inline-size: 100%) so it can never
   * overflow its card, but it also stops the chart growing. `useChartSize` is NOT needed for
   * this — charts call it internally.
   * @see the component manifest
   */
  width?: number
  /** SVG height in px (default 320). Unlike `width`, this does not track the container. */
  height?: number
  tooltip?: boolean
  className?: string
  /**
   * Marks only — no axes, grid lines, or legend. For micro/inline charts.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  plain?: boolean
  /** Reference lines, bands, and markers. `y` maps to the bar value axis. */
  annotations?: readonly Annotation[]
}

const BAR_COLOR = 'var(--cascivo-chart-1)'
const LINE_COLOR = 'var(--cascivo-chart-2)'

export function ComboChart({
  bars,
  line,
  title,
  description,
  secondAxis = false,
  barsLabel = 'Bars',
  lineLabel = 'Line',
  legend,
  xLabelEvery,
  width: fixedWidth,
  height,
  tooltip,
  className,
  plain,
  annotations,
}: ComboChartProps) {
  useSignals()
  const hidden = useSignal(new Set<string>())
  const resolvedHeight = height ?? (plain ? 48 : 320)

  const barMax = bars.reduce((m, b) => Math.max(m, b.value), 0) || 1
  const lineMin = line.length > 0 ? Math.min(...line.map((p) => p.y)) : 0
  const lineMax = line.length > 0 ? Math.max(...line.map((p) => p.y)) : 1
  const hasData = bars.length > 0
  const showLegend = plain ? false : (legend ?? (bars.length > 0 && line.length > 0))

  // The two collections are correlated by index with nothing enforcing it, so a
  // mismatch silently reinterprets the line's x as a fraction of the plot width and
  // draws a plausible-looking but wrong chart.
  if (line.length > 0 && bars.length > 0 && line.length !== bars.length) {
    warnOnce(
      'ComboChart:length-mismatch',
      `ComboChart: \`line\` has ${line.length} point(s) but \`bars\` has ${bars.length}. ` +
        'The two are correlated by array index, so the line is drawn against the wrong ' +
        'categories. Pass one line point per bar (use a null-valued point for a gap).',
    )
  }
  // Sharing one axis across metrics of very different magnitude flattens the smaller one.
  if (!secondAxis && line.length > 0 && bars.length > 0) {
    warnScaleMismatch('ComboChart', [
      { label: barsLabel, max: barMax },
      { label: lineLabel, max: lineMax },
    ])
  }

  // Reserve real room for the axis chrome. Before this, ComboChart used the bare
  // DEFAULT_MARGINS and a magic `right: 60`, so a 6-glyph left label ("60,000") was
  // clipped to "),000" and a right axis was clipped at the SVG edge — while the helpers
  // that size both had existed all along and three sibling charts already called them.
  const barTickLabels = linearScale([0, barMax], [0, 1])
    .ticks(5)
    .map((v) => v.toLocaleString())
  const lineTickLabels = secondAxis
    ? linearScale([lineMin, lineMax || lineMin + 1], [0, 1])
        .ticks(5)
        .map((v) => v.toLocaleString())
    : []
  const categoryLabels = bars.map((b) => b.label)
  const margins = plain
    ? PLAIN_MARGINS
    : {
        ...DEFAULT_MARGINS,
        left: leftMarginForLabels(barTickLabels, plain),
        right: rightMarginForLabels({ rightAxisLabels: lineTickLabels, plain }),
      }

  const fallback = (
    <table>
      <caption>{title}</caption>
      <thead>
        <tr>
          <th>Label</th>
          <th>{barsLabel}</th>
          {line.length > 0 && <th>{lineLabel}</th>}
        </tr>
      </thead>
      <tbody>
        {bars.map((b, i) => (
          <tr key={b.label}>
            <td>{b.label}</td>
            <td>{b.value}</td>
            {/* The line series must appear in the accessible representation too —
                omitting it made a two-metric chart a one-metric table for AT users. */}
            {line.length > 0 && <td>{line[i]?.y ?? ''}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  )

  /** Build tooltip model using the chart's resolved pixel dimensions. */
  const buildTooltip = ({
    width: w,
    height: h,
  }: {
    width: number
    height: number
  }): TooltipModel | undefined => {
    if (tooltip === false || !hasData) return undefined

    const inner = {
      width: w - margins.left - margins.right,
      height: h - margins.top - margins.bottom,
    }
    if (inner.width <= 0) return undefined

    const xScale = bandScale(
      bars.map((b) => b.label),
      [0, inner.width],
      0.2,
    )
    const barYScale = linearScale([0, barMax], [inner.height, 0])
    const lineYScale = secondAxis
      ? linearScale([lineMin, lineMax || lineMin + 1], [inner.height, 0])
      : barYScale

    const barPoints: ChartPoint[] = bars.map((b, i) => ({
      id: `bar-${i}`,
      cx: margins.left + (xScale.map(b.label) ?? 0) + xScale.bandwidth / 2,
      cy: margins.top + barYScale.map(b.value),
      label: b.label,
      value: b.value,
      seriesId: 'bars',
    }))

    const linePoints: ChartPoint[] = line.map((p, i) => {
      const bx = bars[i]
        ? (xScale.map(bars[i]!.label) ?? 0) + xScale.bandwidth / 2
        : (inner.width * p.x) / Math.max(1, line.length - 1)
      return {
        id: `line-${i}`,
        cx: margins.left + bx,
        cy: margins.top + lineYScale.map(p.y),
        label: bars[i]?.label ?? String(p.x),
        value: p.y,
        seriesId: 'line',
      }
    })

    return { points: [...barPoints, ...linePoints] }
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cascivo-space-2)' }}
      className={className}
    >
      <ChartFrame
        title={title}
        description={description}
        width={fixedWidth}
        height={resolvedHeight}
        fallback={fallback}
        plain={plain}
        tooltip={tooltip !== false && hasData ? buildTooltip : undefined}
      >
        {({ width, height: h }) => {
          const inner = {
            width: width - margins.left - margins.right,
            height: h - margins.top - margins.bottom,
          }
          if (inner.width <= 0 || bars.length === 0) return null

          const xScale = bandScale(
            bars.map((b) => b.label),
            [0, inner.width],
            0.2,
          )
          const barYScale = linearScale([0, barMax], [inner.height, 0])

          // Line x: map by index if line.length === bars.length, else by line.x as fraction
          const lineYScale = secondAxis
            ? linearScale([lineMin, lineMax || lineMin + 1], [inner.height, 0])
            : barYScale

          const linePoints: [number, number][] = line.map((p, i) => {
            const bx = bars[i]
              ? (xScale.map(bars[i]!.label) ?? 0) + xScale.bandwidth / 2
              : (inner.width * p.x) / Math.max(1, line.length - 1)
            return [bx, lineYScale.map(p.y)]
          })

          const pathD = linePoints.length > 1 ? linePath(linePoints, 'monotone') : ''

          // Thin crowded category labels. Without this a 30-day axis renders
          // "Jun 27Jun 28Jun 29…" as one solid smear.
          const labelEvery = xLabelEvery ?? autoLabelStride(categoryLabels, inner.width)
          const barsHidden = hidden.value.has('bars')
          const lineHidden = hidden.value.has('line')

          return (
            <g transform={`translate(${margins.left},${margins.top})`}>
              {!plain && <GridLines scale={barYScale} orientation="y" length={inner.width} />}
              {!plain &&
                renderAnnotations(annotations, {
                  xScale,
                  yScale: barYScale,
                  innerW: inner.width,
                  innerH: inner.height,
                })}
              {!barsHidden &&
                bars.map((b) => {
                  const bx = xScale.map(b.label) ?? 0
                  const by = barYScale.map(b.value)
                  return (
                    <rect
                      key={b.label}
                      x={bx}
                      y={by}
                      width={xScale.bandwidth}
                      height={Math.max(0, inner.height - by)}
                      fill={BAR_COLOR}
                      opacity={0.75}
                    />
                  )
                })}
              {pathD && !lineHidden && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={LINE_COLOR}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
              {!plain && (
                <>
                  <Axis
                    scale={xScale}
                    orientation="x"
                    length={inner.width}
                    labelEvery={labelEvery}
                    transform={`translate(0,${inner.height})`}
                  />
                  <Axis scale={barYScale} orientation="y" length={inner.height} />
                  {secondAxis && (
                    <Axis
                      scale={lineYScale}
                      orientation="y-right"
                      length={inner.height}
                      transform={`translate(${inner.width},0)`}
                    />
                  )}
                </>
              )}
            </g>
          )
        }}
      </ChartFrame>
      {showLegend && (
        <Legend
          series={[
            { id: 'bars', label: barsLabel, color: BAR_COLOR },
            ...(line.length > 0 ? [{ id: 'line', label: lineLabel, color: LINE_COLOR }] : []),
          ]}
          hidden={hidden}
        />
      )}
    </div>
  )
}
