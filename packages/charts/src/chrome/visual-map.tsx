'use client'
import { useSignals, type Signal } from '@cascivo/core'
import { rampOf, rampStops, type RampKind } from '../engine/ramp'

export type VisualChannel = 'color' | 'size' | 'both'
export type VisualMode = 'continuous' | 'piecewise'

export interface VisualMapOptions {
  /** Domain minimum (value mapped to ramp t=0). */
  min: number
  /** Domain maximum (value mapped to ramp t=1). */
  max: number
  /** `continuous` ramp (default) or `piecewise` buckets. */
  mode?: VisualMode
  /** Which visual channel(s) the value drives. Default `color`. */
  channel?: VisualChannel
  /** Ramp family — CVD-safe `sequential` (default) or `diverging`. */
  ramp?: RampKind
  /** Bucket count for `piecewise` (default 5). */
  pieces?: number
  /** [min, max] mark radius in px for the `size` channel (default [3, 14]). */
  sizeRange?: [number, number]
}

export interface VisualResult {
  color?: string
  size?: number
}

const DEFAULT_PIECES = 5
const DEFAULT_SIZE: [number, number] = [3, 14]
const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t)
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

const norm = (value: number, o: VisualMapOptions): number =>
  clamp01((value - o.min) / (o.max - o.min || 1))

/** Piecewise bucket index (0…pieces-1) a value falls into. */
export function pieceIndex(value: number, o: VisualMapOptions): number {
  const n = o.pieces ?? DEFAULT_PIECES
  return Math.min(n - 1, Math.max(0, Math.floor(norm(value, o) * n)))
}

/** Resolve a value to its `{ color?, size? }` on the configured channel(s). */
export function mapVisual(value: number, o: VisualMapOptions): VisualResult {
  const channel = o.channel ?? 'color'
  const ramp = o.ramp ?? 'sequential'
  const t = norm(value, o)
  const res: VisualResult = {}
  if (channel === 'color' || channel === 'both') {
    res.color =
      (o.mode ?? 'continuous') === 'piecewise'
        ? rampStops(o.pieces ?? DEFAULT_PIECES, ramp)[pieceIndex(value, o)]!
        : rampOf(ramp)(t)
  }
  if (channel === 'size' || channel === 'both') {
    const [s0, s1] = o.sizeRange ?? DEFAULT_SIZE
    res.size = lerp(s0, s1, t)
  }
  return res
}

/**
 * Whether a value passes the legend filter — within the continuous `range`, or in a
 * non-hidden piecewise bucket. Charts dim/hide marks for which this is false.
 */
export function visualVisible(
  value: number,
  o: VisualMapOptions,
  range: [number, number] | null,
  hidden: ReadonlySet<number> | null,
): boolean {
  if ((o.mode ?? 'continuous') === 'piecewise') {
    return !hidden?.has(pieceIndex(value, o))
  }
  if (!range) return true
  return value >= range[0] && value <= range[1]
}

export interface VisualMapProps {
  options: VisualMapOptions
  /** Continuous filter window in value space (mutated by the thumbs). */
  range?: Signal<[number, number]>
  /** Piecewise hidden bucket indices (toggled by the swatches). */
  hidden?: Signal<Set<number>>
  /** Accessible label for the legend group. */
  label?: string
  /** Value formatter for tick/swatch labels. */
  format?: (v: number) => string
}

/**
 * The visualMap legend. `continuous` → a CVD-safe gradient bar with two draggable,
 * keyboard-operable thumbs that filter the visible range. `piecewise` → a row of
 * clickable swatches that toggle their bucket. Resolution-independent (0–100 viewBox).
 */
export function VisualMap({ options, range, hidden, label = 'Value', format }: VisualMapProps) {
  useSignals()
  const fmt = format ?? ((v: number) => String(Math.round(v)))
  const mode = options.mode ?? 'continuous'

  if (mode === 'piecewise') {
    const n = options.pieces ?? DEFAULT_PIECES
    const stops = rampStops(n, options.ramp ?? 'sequential')
    const step = (options.max - options.min) / n
    const hiddenSet = hidden?.value ?? new Set<number>()
    const toggle = (i: number) => {
      if (!hidden) return
      const next = new Set(hidden.value)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      hidden.value = next
    }
    return (
      <div
        role="group"
        aria-label={`${label} — colour buckets`}
        style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', alignItems: 'center' }}
      >
        {stops.map((color, i) => {
          const lo = options.min + i * step
          const hi = options.min + (i + 1) * step
          const off = hiddenSet.has(i)
          return (
            <button
              key={i}
              type="button"
              aria-pressed={!off}
              onClick={() => toggle(i)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.2rem 0.45rem',
                minBlockSize: 'var(--cascivo-target-min-coarse, 1.75rem)',
                border: '1px solid var(--cascivo-chart-grid, currentColor)',
                borderRadius: '0.375rem',
                background: 'transparent',
                color: 'var(--cascivo-color-foreground, inherit)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                opacity: off ? 0.4 : 1,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  background: color,
                  display: 'inline-block',
                }}
              />
              {`${fmt(lo)}–${fmt(hi)}`}
            </button>
          )
        })}
      </div>
    )
  }

  // Continuous gradient bar + two thumbs filtering the value range.
  const { min, max } = options
  const span = max - min || 1
  const stops = rampStops(8, options.ramp ?? 'sequential')
  const fracOf = (v: number) => ((v - min) / span) * 100
  const lo = range?.value[0] ?? min
  const hi = range?.value[1] ?? max
  const gradId = `vm-grad-${stops.length}`

  const valAt = (clientX: number, svg: SVGSVGElement): number => {
    const rect = svg.getBoundingClientRect()
    if (rect.width === 0) return min
    return min + clamp01((clientX - rect.left) / rect.width) * span
  }
  const move = (which: 0 | 1, v: number) => {
    if (!range) return
    const clamped = Math.max(min, Math.min(max, v))
    const [cl, ch] = range.value
    range.value = which === 0 ? [Math.min(clamped, ch), ch] : [cl, Math.max(clamped, cl)]
  }
  const step = span / 100
  const onKey = (which: 0 | 1, v: number) => (ev: React.KeyboardEvent<SVGRectElement>) => {
    if (ev.key === 'ArrowLeft') (ev.preventDefault(), move(which, v - step))
    else if (ev.key === 'ArrowRight') (ev.preventDefault(), move(which, v + step))
    else if (ev.key === 'Home') (ev.preventDefault(), move(which, min))
    else if (ev.key === 'End') (ev.preventDefault(), move(which, max))
  }
  const onPointer = (which: 0 | 1) => (ev: React.PointerEvent<SVGRectElement>) => {
    if (ev.buttons !== 1 || !ev.currentTarget.ownerSVGElement) return
    move(which, valAt(ev.clientX, ev.currentTarget.ownerSVGElement))
  }
  const thumb = (which: 0 | 1, v: number) => (
    <rect
      data-visual-thumb={which === 0 ? 'low' : 'high'}
      role="slider"
      tabIndex={0}
      aria-label={`${label} ${which === 0 ? 'minimum' : 'maximum'}`}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(v)}
      x={fracOf(v) - 0.8}
      y={0}
      width={1.6}
      height={20}
      rx={0.6}
      fill="var(--cascivo-color-foreground, currentColor)"
      style={{ cursor: 'ew-resize', touchAction: 'none' }}
      onPointerDown={(ev) => ev.currentTarget.setPointerCapture(ev.pointerId)}
      onPointerMove={onPointer(which)}
      onKeyDown={onKey(which, v)}
    />
  )

  return (
    <svg
      width="100%"
      height={20}
      viewBox="0 0 100 20"
      preserveAspectRatio="none"
      role="group"
      aria-label={`${label} — showing ${fmt(lo)} to ${fmt(hi)}`}
      style={{ display: 'block', touchAction: 'none' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          {stops.map((c, i) => (
            <stop key={i} offset={`${(i / (stops.length - 1)) * 100}%`} stopColor={c} />
          ))}
        </linearGradient>
      </defs>
      <rect x={0} y={6} width={100} height={8} rx={2} fill={`url(#${gradId})`} />
      {range && (
        <>
          {/* dim the filtered-out ends */}
          <rect
            x={0}
            y={6}
            width={Math.max(0, fracOf(lo))}
            height={8}
            fill="var(--cascivo-surface-base, white)"
            fillOpacity={0.6}
          />
          <rect
            x={fracOf(hi)}
            y={6}
            width={Math.max(0, 100 - fracOf(hi))}
            height={8}
            fill="var(--cascivo-surface-base, white)"
            fillOpacity={0.6}
          />
          {thumb(0, lo)}
          {thumb(1, hi)}
        </>
      )}
    </svg>
  )
}
