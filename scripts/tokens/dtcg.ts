/**
 * CSS custom-property values → W3C Design Tokens (DTCG 2025.10) tokens.
 *
 * Pure functions only; `generate-dtcg.ts` does the I/O. A value that DTCG cannot express
 * (`calc()`, `em`, `color-mix()`, keywords) converts to `undefined` rather than to a guess —
 * the generator lists those tokens instead of shipping a wrong value to a design tool.
 */

export type DtcgValue =
  | { $type: 'color'; $value: DtcgColor }
  | { $type: 'dimension'; $value: { value: number; unit: 'px' | 'rem' } }
  | { $type: 'duration'; $value: { value: number; unit: 'ms' | 's' } }
  | { $type: 'fontFamily'; $value: string[] }
  | { $type: 'fontWeight'; $value: number }
  | { $type: 'number'; $value: number }
  | { $type: 'cubicBezier'; $value: [number, number, number, number] }
  | { $type: 'shadow'; $value: DtcgShadow[] }

export interface DtcgColor {
  colorSpace: 'oklch' | 'srgb'
  components: [number, number, number]
  alpha?: number
  hex?: string
}

export interface DtcgShadow {
  color: DtcgColor
  offsetX: { value: number; unit: 'px' | 'rem' }
  offsetY: { value: number; unit: 'px' | 'rem' }
  blur: { value: number; unit: 'px' | 'rem' }
  spread: { value: number; unit: 'px' | 'rem' }
  inset?: boolean
}

const PREFIX = '--cascivo-'
const NUM = String.raw`[-+]?(?:\d+\.?\d*|\.\d+)`

/** `--cascivo-blue-500` → `blue-500`. DTCG forbids `.` in names, so `space-0.5` → `space-0_5`. */
export function tokenKey(cssName: string): string {
  return cssName.replace(PREFIX, '').replaceAll('.', '_')
}

/** The `{group.key}` reference for a token, given the group it is filed under. */
export function aliasOf(group: string, cssName: string): string {
  return `{${group}.${tokenKey(cssName)}}`
}

/** A bare `var(--cascivo-x)` (no fallback, nothing around it) → `--cascivo-x`. */
export function varTarget(value: string): string | undefined {
  return /^var\((--cascivo-[a-z0-9.-]+)\)$/.exec(value.trim())?.[1]
}

function parseAlpha(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined
  const a = raw.endsWith('%') ? Number(raw.slice(0, -1)) / 100 : Number(raw)
  return Number.isFinite(a) ? a : undefined
}

/** OKLCH → gamma-encoded sRGB hex, clamped into gamut (the optional DTCG `hex` fallback). */
export function oklchToHex(l: number, c: number, h: number): string {
  const hr = (h * Math.PI) / 180
  const a = c * Math.cos(hr)
  const b = c * Math.sin(hr)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const linear = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
  return `#${linear
    .map((x) => {
      const v = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055
      return Math.round(Math.min(1, Math.max(0, v)) * 255)
        .toString(16)
        .padStart(2, '0')
    })
    .join('')}`
}

export function parseColor(value: string): DtcgColor | undefined {
  const v = value.trim()
  const oklch = new RegExp(
    String.raw`^oklch\(\s*(${NUM}%?)\s+(${NUM})\s+(${NUM}|none)\s*(?:\/\s*(${NUM}%?))?\s*\)$`,
  ).exec(v)
  if (oklch) {
    const [, lRaw = '', cRaw = '', hRaw = '', aRaw] = oklch
    const l = lRaw.endsWith('%') ? Number(lRaw.slice(0, -1)) / 100 : Number(lRaw)
    const c = Number(cRaw)
    // An achromatic colour has no hue; DTCG's "none" is not a number, so use 0 (C is 0 anyway).
    const h = hRaw === 'none' ? 0 : Number(hRaw)
    const alpha = parseAlpha(aRaw)
    return {
      colorSpace: 'oklch',
      components: [l, c, h],
      ...(alpha !== undefined && alpha !== 1 ? { alpha } : {}),
      hex: oklchToHex(l, c, h),
    }
  }
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v)
  if (hex) {
    const digits = hex[1] ?? ''
    const full = digits.length === 3 ? [...digits].map((d) => d + d).join('') : digits
    const channel = (i: number): number => parseInt(full.slice(i, i + 2), 16) / 255
    return {
      colorSpace: 'srgb',
      components: [channel(0), channel(2), channel(4)],
      hex: `#${full.toLowerCase()}`,
    }
  }
  return undefined
}

function parseLength(raw: string): { value: number; unit: 'px' | 'rem' } | undefined {
  if (raw === '0') return { value: 0, unit: 'px' }
  const m = new RegExp(String.raw`^(${NUM})(px|rem)$`).exec(raw)
  return m ? { value: Number(m[1]), unit: m[2] as 'px' | 'rem' } : undefined
}

/** Split on commas that are not inside parentheses (shadow lists, font stacks). */
function splitTopLevel(value: string, sep: string): string[] {
  const out: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of value) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === sep && depth === 0) {
      out.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}

export function parseShadow(value: string): DtcgShadow[] | undefined {
  const layers = splitTopLevel(value, ',')
  const out: DtcgShadow[] = []
  for (const layer of layers) {
    const inset = /^inset\s+/.test(layer)
    const body = layer.replace(/^inset\s+/, '')
    const colorStart = body.search(/oklch\(|#/)
    if (colorStart === -1) return undefined
    const color = parseColor(body.slice(colorStart))
    const lengths = body.slice(0, colorStart).trim().split(/\s+/).map(parseLength)
    // Check before destructuring: a length that failed to parse is `undefined` too, and the
    // defaults below would quietly turn it into 0.
    if (!color || lengths.length < 2 || lengths.length > 4 || lengths.includes(undefined)) {
      return undefined
    }
    const zero = { value: 0, unit: 'px' as const }
    const [offsetX, offsetY, blur = zero, spread = zero] = lengths
    if (!offsetX || !offsetY || !blur || !spread) return undefined
    out.push({ color, offsetX, offsetY, blur, spread, ...(inset ? { inset } : {}) })
  }
  return out.length > 0 ? out : undefined
}

/**
 * One literal CSS value → a typed DTCG token, or `undefined` when DTCG has no faithful form.
 * `group` disambiguates the unitless numbers: a font weight and a line height look alike.
 */
export function convertValue(value: string, group: string): DtcgValue | undefined {
  const v = value.trim()
  const color = parseColor(v)
  if (color) return { $type: 'color', $value: color }

  const length = parseLength(v)
  if (length && v !== '0') return { $type: 'dimension', $value: length }

  const duration = new RegExp(String.raw`^(${NUM})(ms|s)$`).exec(v)
  if (duration) {
    return {
      $type: 'duration',
      $value: { value: Number(duration[1]), unit: duration[2] as 'ms' | 's' },
    }
  }

  const bezier = new RegExp(
    String.raw`^cubic-bezier\(\s*(${NUM})\s*,\s*(${NUM})\s*,\s*(${NUM})\s*,\s*(${NUM})\s*\)$`,
  ).exec(v)
  if (bezier) {
    const [, a, b, c, d] = bezier
    return { $type: 'cubicBezier', $value: [Number(a), Number(b), Number(c), Number(d)] }
  }

  if (new RegExp(`^${NUM}$`).test(v)) {
    const n = Number(v)
    if (/weight/.test(group) || (group === 'font' && n >= 100 && n % 100 === 0)) {
      return { $type: 'fontWeight', $value: n }
    }
    return { $type: 'number', $value: n }
  }

  if (group === 'font' && /[a-z]/i.test(v) && !/[()]/.test(v)) {
    return {
      $type: 'fontFamily',
      $value: splitTopLevel(v, ',').map((f) => f.replace(/^['"]|['"]$/g, '')),
    }
  }

  if (group === 'shadow') {
    const shadow = parseShadow(v)
    if (shadow) return { $type: 'shadow', $value: shadow }
  }

  return undefined
}
