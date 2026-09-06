/**
 * Colour conversion and parsing, kept pure so every edge — 3/4/6/8-digit hex, the NaN
 * fallback, round-trip fidelity — is unit-testable without a DOM.
 *
 * The picking area is **HSV**, not HSL. The area's gradient is the classic
 * `linear-gradient(to top, #000, transparent)` over `linear-gradient(to right, #fff,
 * transparent)` on a pure-hue ground, which paints saturation on x and *value* on y. The
 * previous build mapped y to HSL lightness against that same gradient, so the two disagreed:
 * clicking the visibly pure hue at the top-right returned `hsl(h, 100%, 100%)` — white — and
 * the thumb for `#ff0000` sat halfway down the area rather than on the colour it names.
 *
 * HSVA is also what the component stores between edits. Hex is 8-bit, so hue→hex→hue loses
 * precision on every nudge; keeping HSVA and deriving hex on the way out means dragging the
 * hue slider no longer bleeds saturation away.
 */

export interface Rgb {
  r: number
  g: number
  b: number
  a: number
}

/** Hue 0–360, saturation and value 0–100, alpha 0–1. */
export interface Hsv {
  h: number
  s: number
  v: number
  a: number
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/** Parse 3-, 4-, 6- and 8-digit hex, with or without `#`. Unparseable input returns null. */
export function parseHex(hex: string): Rgb | null {
  const h = hex.trim().replace(/^#/, '')
  if (!/^(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(h)) return null
  const expand = (s: string): string =>
    s.length <= 4
      ? s
          .split('')
          .map((c) => c + c)
          .join('')
      : s
  const full = expand(h)
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
    a: full.length >= 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1,
  }
}

/**
 * Hex string for `rgb`. `withAlpha` forces the 8-digit form even at full opacity, so a caller
 * that has enabled alpha always receives a fixed width — the old build silently dropped the
 * alpha pair whenever `a >= 1`, flipping the output between 7 and 9 characters.
 */
export function toHex({ r, g, b, a }: Rgb, withAlpha: boolean): string {
  const part = (n: number): string => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0')
  const base = `#${part(r)}${part(g)}${part(b)}`
  return withAlpha ? base + part(a * 255) : base
}

/** `rgb(r g b)` / `rgb(r g b / a)` in the modern space-separated form. */
export function toRgbString({ r, g, b, a }: Rgb, withAlpha: boolean): string {
  const n = (x: number): number => clamp(Math.round(x), 0, 255)
  const body = `${n(r)} ${n(g)} ${n(b)}`
  return withAlpha ? `rgb(${body} / ${round(a, 2)})` : `rgb(${body})`
}

/** `hsl(h s% l%)` / `hsl(h s% l% / a)`, converted from HSV. */
export function toHslString(hsv: Hsv, withAlpha: boolean): string {
  const { h, s, l } = hsvToHsl(hsv)
  const body = `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`
  return withAlpha ? `hsl(${body} / ${round(hsv.a, 2)})` : `hsl(${body})`
}

function round(n: number, places: number): number {
  const f = 10 ** places
  return Math.round(n * f) / f
}

export function rgbToHsv({ r, g, b, a }: Rgb): Hsv {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : (d / max) * 100, v: max * 100, a }
}

export function hsvToRgb({ h, s, v, a }: Hsv): Rgb {
  const sn = clamp(s, 0, 100) / 100
  const vn = clamp(v, 0, 100) / 100
  const hn = ((h % 360) + 360) % 360
  const c = vn * sn
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1))
  const m = vn - c
  let rn = 0
  let gn = 0
  let bn = 0
  if (hn < 60) [rn, gn, bn] = [c, x, 0]
  else if (hn < 120) [rn, gn, bn] = [x, c, 0]
  else if (hn < 180) [rn, gn, bn] = [0, c, x]
  else if (hn < 240) [rn, gn, bn] = [0, x, c]
  else if (hn < 300) [rn, gn, bn] = [x, 0, c]
  else [rn, gn, bn] = [c, 0, x]
  return { r: (rn + m) * 255, g: (gn + m) * 255, b: (bn + m) * 255, a }
}

/** HSV → HSL, for the `hsl()` output format. */
export function hsvToHsl({ h, s, v, a }: Hsv): { h: number; s: number; l: number; a: number } {
  const sn = clamp(s, 0, 100) / 100
  const vn = clamp(v, 0, 100) / 100
  const l = vn * (1 - sn / 2)
  const sl = l === 0 || l === 1 ? 0 : (vn - l) / Math.min(l, 1 - l)
  return { h, s: sl * 100, l: l * 100, a }
}

/** The output formats an adopter can ask for. */
export type ColorFormat = 'hex' | 'rgb' | 'hsl'

/** Serialise `hsv` in `format`, including alpha only when the component enables it. */
export function formatColor(hsv: Hsv, format: ColorFormat, withAlpha: boolean): string {
  if (format === 'rgb') return toRgbString(hsvToRgb(hsv), withAlpha)
  if (format === 'hsl') return toHslString(hsv, withAlpha)
  return toHex(hsvToRgb(hsv), withAlpha)
}

/**
 * Parse any of the three output formats back to HSV, so a controlled `value` round-trips
 * whatever the component last emitted. Returns null on anything unrecognised.
 */
export function parseColor(value: string): Hsv | null {
  const text = value.trim()
  const rgbMatch =
    /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[/,]\s*([\d.%]+))?\s*\)$/i.exec(text)
  if (rgbMatch) {
    return rgbToHsv({
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3]),
      a: parseAlpha(rgbMatch[4]),
    })
  }
  const hslMatch =
    /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:\s*[/,]\s*([\d.%]+))?\s*\)$/i.exec(
      text,
    )
  if (hslMatch) {
    return hslToHsv(
      Number(hslMatch[1]),
      Number(hslMatch[2]),
      Number(hslMatch[3]),
      parseAlpha(hslMatch[4]),
    )
  }
  const rgb = parseHex(text)
  return rgb ? rgbToHsv(rgb) : null
}

function parseAlpha(raw: string | undefined): number {
  if (raw === undefined) return 1
  const n = raw.endsWith('%') ? Number(raw.slice(0, -1)) / 100 : Number(raw)
  return Number.isNaN(n) ? 1 : clamp(n, 0, 1)
}

function hslToHsv(h: number, s: number, l: number, a: number): Hsv {
  const sn = clamp(s, 0, 100) / 100
  const ln = clamp(l, 0, 100) / 100
  const v = ln + sn * Math.min(ln, 1 - ln)
  return { h, s: v === 0 ? 0 : 2 * (1 - ln / v) * 100, v: v * 100, a }
}

/** True when both colours resolve to the same 8-bit RGBA, so `#FFF` matches `#ffffff`. */
export function sameColor(a: string, b: string): boolean {
  const pa = parseColor(a)
  const pb = parseColor(b)
  if (!pa || !pb) return false
  const ra = hsvToRgb(pa)
  const rb = hsvToRgb(pb)
  return (
    Math.round(ra.r) === Math.round(rb.r) &&
    Math.round(ra.g) === Math.round(rb.g) &&
    Math.round(ra.b) === Math.round(rb.b) &&
    Math.round(ra.a * 255) === Math.round(rb.a * 255)
  )
}
