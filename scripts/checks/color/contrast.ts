import { oklchToSrgb, type RGB } from './cvd.ts'

/** WCAG 2.x relative luminance of a linear sRGB color (IEC 61966-2-1). */
export function relativeLuminance(rgb: RGB): number {
  const [r, g, b] = rgb
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 2.x contrast ratio between two linear sRGB colors. Range: [1, 21]. */
export function contrastRatio(a: RGB, b: RGB): number {
  const L1 = relativeLuminance(a)
  const L2 = relativeLuminance(b)
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Parse an oklch() CSS value string, e.g. "oklch(0.74 0.13 70)", into
 * linear sRGB. Accepts optional percentage on L and C. Ignores alpha.
 */
export function parseOklch(value: string): RGB {
  const m = value.match(/oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)\s*(?:\/[^)]+)?\)/i)
  if (!m) throw new Error(`parseOklch: cannot parse "${value}"`)

  const l = m[1]!.endsWith('%') ? parseFloat(m[1]!) / 100 : parseFloat(m[1]!)
  const c = m[2]!.endsWith('%') ? parseFloat(m[2]!) / 100 : parseFloat(m[2]!)
  const h = parseFloat(m[3]!)

  return oklchToSrgb(l, c, h)
}

export type { RGB }
