/**
 * CVD-safe colour ramps for data→colour encoding. Colours are interpolated in
 * **oklch** between perceptually ordered anchors:
 * - `sequential` runs light→dark with monotonically decreasing lightness, so the
 *   ordering survives any colour-vision deficiency (luminance carries the signal).
 * - `diverging` runs a CVD-safe blue→neutral→orange pair, symmetric in lightness.
 * Returned values are CSS `oklch()` strings — no `var()`, so they serialize cleanly
 * for export and render identically across themes.
 */

export type RampKind = 'sequential' | 'diverging'

interface Oklch {
  l: number
  c: number
  h: number
}

const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t)
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
const mix = (a: Oklch, b: Oklch, t: number): Oklch => ({
  l: lerp(a.l, b.l, t),
  c: lerp(a.c, b.c, t),
  h: lerp(a.h, b.h, t),
})
const css = ({ l, c, h }: Oklch): string => `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(2)})`

// Sequential anchors — light low-chroma → dark saturated, lightness strictly decreasing.
const SEQ_LO: Oklch = { l: 0.95, c: 0.04, h: 232 }
const SEQ_HI: Oklch = { l: 0.34, c: 0.15, h: 274 }

// Diverging anchors — blue ↔ near-neutral ↔ orange (a classic CVD-safe pair).
const DIV_LO: Oklch = { l: 0.48, c: 0.14, h: 248 }
const DIV_MID: Oklch = { l: 0.96, c: 0.02, h: 110 }
const DIV_HI: Oklch = { l: 0.52, c: 0.15, h: 42 }

/** Sequential ramp (light→dark) at `t ∈ [0,1]`; clamps out-of-range. */
export function sequentialRamp(t: number): string {
  return css(mix(SEQ_LO, SEQ_HI, clamp01(t)))
}

/** Diverging ramp (blue→neutral→orange) at `t ∈ [0,1]`; clamps out-of-range. */
export function divergingRamp(t: number): string {
  const tt = clamp01(t)
  return tt < 0.5 ? css(mix(DIV_LO, DIV_MID, tt * 2)) : css(mix(DIV_MID, DIV_HI, (tt - 0.5) * 2))
}

/** The ramp function for a kind. */
export function rampOf(kind: RampKind): (t: number) => string {
  return kind === 'diverging' ? divergingRamp : sequentialRamp
}

/** `n` evenly-spaced ramp colours (for piecewise buckets + the legend gradient). */
export function rampStops(n: number, kind: RampKind = 'sequential'): string[] {
  const fn = rampOf(kind)
  if (n <= 1) return [fn(0)]
  return Array.from({ length: n }, (_, i) => fn(i / (n - 1)))
}

/** Read the lightness (L) component out of an `oklch(L C H)` string — test/util helper. */
export function rampLightness(color: string): number {
  const m = /oklch\(([\d.]+)/.exec(color)
  return m ? Number(m[1]) : NaN
}
