import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// ── Inlined color math (mirrors scripts/checks/color/) ────────────────────────
// Kept self-contained so this test has no cross-package import dependencies.

type RGB = [number, number, number]

function oklchToOklab(l: number, c: number, h: number): [number, number, number] {
  const hRad = (h * Math.PI) / 180
  return [l, c * Math.cos(hRad), c * Math.sin(hRad)]
}

function oklabToLinearSrgb(L: number, a: number, b: number): RGB {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

function oklchToSrgb(l: number, c: number, h: number): RGB {
  const [L, a, b] = oklchToOklab(l, c, h)
  return oklabToLinearSrgb(L, a, b)
}

// Protan/deutan: Viénot et al. 1999. Tritan: Brettel et al. 1997. Dichromacy (severity=1).
const CVD_MATRICES = {
  protan: [
    [0.20126, 0.99183, -0.19309],
    [0.13307, 0.72521, 0.14172],
    [0.01592, 0.02985, 0.95424],
  ] as const,
  deutan: [
    [0.43054, 0.56946, 0.0],
    [0.11167, 0.88833, 0.0],
    [0.0, 0.11888, 0.88112],
  ] as const,
  tritan: [
    [1.0, 0.14461, -0.14461],
    [0.0, 0.97135, 0.02865],
    [0.0, 0.86717, 0.13283],
  ] as const,
}

function simulate(rgb: RGB, type: 'protan' | 'deutan' | 'tritan'): RGB {
  const m = CVD_MATRICES[type]
  const [r, g, b] = rgb
  return [
    m[0][0] * r + m[0][1] * g + m[0][2] * b,
    m[1][0] * r + m[1][1] * g + m[1][2] * b,
    m[2][0] * r + m[2][1] * g + m[2][2] * b,
  ]
}

function distinguishable(a: RGB, b: RGB, type: 'protan' | 'deutan' | 'tritan'): boolean {
  // Euclidean distance in linear RGB after CVD simulation. Threshold 0.1 is empirically
  // sufficient for dichromacy discrimination (mirrors scripts/checks/color/cvd.ts).
  const THRESHOLD = 0.1
  const sa = simulate(a, type)
  const sb = simulate(b, type)
  const dist = Math.sqrt((sa[0] - sb[0]) ** 2 + (sa[1] - sb[1]) ** 2 + (sa[2] - sb[2]) ** 2)
  return dist >= THRESHOLD
}

function relativeLuminance(rgb: RGB): number {
  const [r, g, b] = rgb
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(a: RGB, b: RGB): number {
  const L1 = relativeLuminance(a)
  const L2 = relativeLuminance(b)
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Parse an oklch() CSS value string into linear sRGB.
 * Accepts "oklch(L C H)" with optional alpha channel (ignored).
 */
function parseOklch(value: string): RGB {
  const m = value.match(/oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)\s*(?:\/[^)]+)?\)/i)
  if (!m) throw new Error(`parseOklch: cannot parse "${value}"`)
  const l = m[1]!.endsWith('%') ? parseFloat(m[1]!) / 100 : parseFloat(m[1]!)
  const c = m[2]!.endsWith('%') ? parseFloat(m[2]!) / 100 : parseFloat(m[2]!)
  const h = parseFloat(m[3]!)
  return oklchToSrgb(l, c, h)
}

// ── Test constants ─────────────────────────────────────────────────────────────

const SRC = join(__dirname)

const THEMES = [
  'dark',
  'flat',
  'light',
  'minimal',
  'warm',
  'midnight',
  'pastel',
  'brutalist',
  'corporate',
  'terminal',
  'cyberpunk',
  'arcade',
] as const

// WCAG non-text minimum contrast (3:1) is used here rather than the text minimum (4.5:1)
// because chart series colors are used as fills and strokes on data marks, not as running
// text. The 3:1 bar aligns with WCAG 2.1 SC 1.4.11 (Non-text Contrast).
const MIN_CONTRAST = 3.0

// Fallback background colors in oklch [L, C, H] for themes whose
// --cascivo-color-background is a var() reference or cannot be parsed inline.
// These are populated from the actual parsed values below; the fallback map
// is used only when parsing fails.
const BG_FALLBACK: Record<string, [number, number, number]> = {
  light: [1, 0, 0],
  corporate: [0.99, 0.003, 250],
  flat: [1, 0, 0],
  minimal: [0.98, 0.005, 80],
  warm: [0.995, 0.006, 80],
  pastel: [0.99, 0.01, 330],
  dark: [0.145, 0.005, 250],
  midnight: [0.16, 0.02, 280],
  terminal: [0.17, 0.01, 150],
  brutalist: [0.97, 0.02, 95],
  cyberpunk: [0.16, 0.03, 285],
  arcade: [0.96, 0.008, 250],
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Extract all --cascivo-chart-N token values from a CSS file.
 * Returns a map of index (1-8) → raw CSS value string.
 */
function parseChartTokens(themeName: string): Map<number, string> {
  const css = readFileSync(join(SRC, `${themeName}.css`), 'utf8')
  const result = new Map<number, string>()
  for (let i = 1; i <= 8; i++) {
    const re = new RegExp(`--cascivo-chart-${i}\\s*:\\s*([^;]+);`)
    const m = css.match(re)
    if (m) result.set(i, m[1]!.trim())
  }
  return result
}

/**
 * Parse --cascivo-color-background from a theme CSS file.
 * Returns null if the value is a var() reference (cannot resolve statically).
 */
function parseThemeBackground(themeName: string): string | null {
  const css = readFileSync(join(SRC, `${themeName}.css`), 'utf8')
  const m = css.match(/--cascivo-color-background\s*:\s*([^;]+);/)
  if (!m) return null
  const value = m[1]!.trim()
  // If it's a var() reference, we cannot resolve statically
  if (value.startsWith('var(')) return null
  return value
}

/**
 * Get the background RGB for a theme, using the parsed CSS value when available
 * and falling back to the known-good oklch triple otherwise.
 */
function themeBackground(themeName: string): RGB {
  const raw = parseThemeBackground(themeName)
  if (raw) {
    try {
      return parseOklch(raw)
    } catch {
      // fall through to fallback
    }
  }
  const fb = BG_FALLBACK[themeName]!
  return oklchToSrgb(fb[0], fb[1], fb[2])
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('chart palette', () => {
  describe('presence — all 12 themes define chart-1 through chart-8', () => {
    for (const theme of THEMES) {
      it(`${theme}: defines --cascivo-chart-1 through --cascivo-chart-8`, () => {
        const tokens = parseChartTokens(theme)
        for (let i = 1; i <= 8; i++) {
          expect(tokens.has(i), `${theme}: missing --cascivo-chart-${i}`).toBe(true)
        }
      })
    }
  })

  describe('contrast — each series color meets WCAG non-text minimum (3:1) vs theme background', () => {
    for (const theme of THEMES) {
      it(`${theme}: all 8 chart colors ≥ ${MIN_CONTRAST}:1 contrast vs background`, () => {
        const tokens = parseChartTokens(theme)
        const bg = themeBackground(theme)
        const failures: string[] = []

        for (let i = 1; i <= 8; i++) {
          const raw = tokens.get(i)
          if (!raw) continue
          let color: RGB
          try {
            color = parseOklch(raw)
          } catch {
            failures.push(`chart-${i}: cannot parse "${raw}"`)
            continue
          }
          const ratio = contrastRatio(color, bg)
          if (ratio < MIN_CONTRAST) {
            failures.push(`chart-${i} "${raw}" contrast ${ratio.toFixed(2)} < ${MIN_CONTRAST}`)
          }
        }

        expect(failures, `${theme} contrast failures:\n  ${failures.join('\n  ')}`).toEqual([])
      })
    }
  })

  // A solid area fill is drawn at --cascivo-chart-fill-opacity over the surface.
  // The original defect: on the dark theme a 0.25-opacity fill desaturated into a
  // muddy near-surface neutral. This guard composites each series color over the
  // theme background at the theme's fill-opacity and asserts the tinted area stays
  // perceptibly distinct from the background (not invisible). Deterministic math.
  describe('fill presence — composited area fill is perceptible over the surface', () => {
    const MIN_FILL_CONTRAST = 1.1
    for (const theme of THEMES) {
      it(`${theme}: every chart fill is distinguishable from the background`, () => {
        const css = readFileSync(join(SRC, `${theme}.css`), 'utf8')
        const foMatch = css.match(/--cascivo-chart-fill-opacity\s*:\s*([\d.]+)/)
        // Themes without an override inherit the 0.25 base from @cascivo/tokens.
        const alpha = foMatch ? parseFloat(foMatch[1]!) : 0.25
        const tokens = parseChartTokens(theme)
        const bg = themeBackground(theme)
        const failures: string[] = []

        for (let i = 1; i <= 8; i++) {
          const raw = tokens.get(i)
          if (!raw) continue
          let fg: RGB
          try {
            fg = parseOklch(raw)
          } catch {
            failures.push(`chart-${i}: cannot parse "${raw}"`)
            continue
          }
          // Alpha-composite fg over bg in linear sRGB (both are linear here).
          const comp: RGB = [
            fg[0] * alpha + bg[0] * (1 - alpha),
            fg[1] * alpha + bg[1] * (1 - alpha),
            fg[2] * alpha + bg[2] * (1 - alpha),
          ]
          const ratio = contrastRatio(comp, bg)
          if (ratio < MIN_FILL_CONTRAST) {
            failures.push(
              `chart-${i} fill @${alpha} contrast ${ratio.toFixed(3)} < ${MIN_FILL_CONTRAST}`,
            )
          }
        }

        expect(failures, `${theme} fill-presence failures:\n  ${failures.join('\n  ')}`).toEqual([])
      })
    }
  })

  describe('CVD distinguishability — adjacent pairs distinguishable under protan/deutan/tritan', () => {
    const CVD_TYPES = ['protan', 'deutan', 'tritan'] as const

    for (const theme of THEMES) {
      it(`${theme}: adjacent chart color pairs are distinguishable under all 3 CVD types`, () => {
        const tokens = parseChartTokens(theme)
        const failures: string[] = []

        for (let i = 1; i <= 7; i++) {
          const rawA = tokens.get(i)
          const rawB = tokens.get(i + 1)
          if (!rawA || !rawB) continue

          let colorA: RGB, colorB: RGB
          try {
            colorA = parseOklch(rawA)
            colorB = parseOklch(rawB)
          } catch {
            failures.push(`chart-${i}/chart-${i + 1}: parse error`)
            continue
          }

          for (const cvdType of CVD_TYPES) {
            if (!distinguishable(colorA, colorB, cvdType)) {
              failures.push(`chart-${i}/chart-${i + 1} indistinguishable under ${cvdType}`)
            }
          }
        }

        expect(failures, `${theme} CVD failures:\n  ${failures.join('\n  ')}`).toEqual([])
      })
    }
  })
})
