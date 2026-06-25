function linearize(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function delinearize(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055
}

/** Convert a 6-digit hex colour to OKLCH hue and chroma. Returns null if invalid. */
export function hexToOklch(hex: string): { hue: number; chroma: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const ri = parseInt(m[1]!.slice(0, 2), 16) / 255
  const gi = parseInt(m[1]!.slice(2, 4), 16) / 255
  const bi = parseInt(m[1]!.slice(4, 6), 16) / 255
  const r = linearize(ri),
    g = linearize(gi),
    b = linearize(bi)
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
  const bv = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_
  const chroma = Math.sqrt(a * a + bv * bv)
  const hue = ((Math.atan2(bv, a) * 180) / Math.PI + 360) % 360
  return { hue, chroma }
}

/** Convert OKLCH to a 6-digit hex string (gamut-clamped to sRGB). */
export function oklchToHex(l: number, c: number, h: number): string {
  const a = c * Math.cos((h * Math.PI) / 180)
  const bv = c * Math.sin((h * Math.PI) / 180)
  const l_ = l + 0.3963377774 * a + 0.2158037573 * bv
  const m_ = l - 0.1055613458 * a - 0.0638541728 * bv
  const s_ = l - 0.0894841775 * a - 1.291485548 * bv
  const lc = l_ ** 3,
    mc = m_ ** 3,
    sc = s_ ** 3
  const r = 4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc
  const g = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc
  const bLin = -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc
  const toHex = (v: number) =>
    Math.round(Math.max(0, Math.min(1, delinearize(v))) * 255)
      .toString(16)
      .padStart(2, '0')
  return '#' + toHex(r) + toHex(g) + toHex(bLin)
}
