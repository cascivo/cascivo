/** Linear sRGB triple, each component in [0..1] */
export type RGB = [number, number, number]

// ── oklch → oklab → linear sRGB ────────────────────────────────────────────

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

/** Convert oklch to linear sRGB. Output may extend slightly outside [0,1] for
 *  out-of-gamut colors; callers that need display values should clamp. */
export function oklchToSrgb(l: number, c: number, h: number): RGB {
  const [L, a, b] = oklchToOklab(l, c, h)
  return oklabToLinearSrgb(L, a, b)
}

// ── CVD simulation matrices ─────────────────────────────────────────────────
// Protan/deutan: Viénot et al. 1999, severity=1 (dichromacy).
// Tritan: Brettel et al. 1997, dichromacy.

const MATRICES = {
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

/** Simulate color-vision deficiency on a linear sRGB color using
 *  Viénot 1999 (protan/deutan) and Brettel 1997 (tritan) matrices. */
export function simulate(rgb: RGB, type: 'protan' | 'deutan' | 'tritan'): RGB {
  const m = MATRICES[type]
  const [r, g, b] = rgb
  return [
    m[0][0] * r + m[0][1] * g + m[0][2] * b,
    m[1][0] * r + m[1][1] * g + m[1][2] * b,
    m[2][0] * r + m[2][1] * g + m[2][2] * b,
  ]
}

// ── Distinguishability ──────────────────────────────────────────────────────

/**
 * Euclidean distance in linear RGB of the CVD-simulated colors.
 * Threshold: 0.1 (empirically sufficient for dichromacy discrimination).
 * Returns true when the two colors are perceptually distinguishable under
 * the given CVD type.
 */
export function distinguishable(a: RGB, b: RGB, type: 'protan' | 'deutan' | 'tritan'): boolean {
  const THRESHOLD = 0.1
  const sa = simulate(a, type)
  const sb = simulate(b, type)
  const dist = Math.sqrt((sa[0] - sb[0]) ** 2 + (sa[1] - sb[1]) ** 2 + (sa[2] - sb[2]) ** 2)
  return dist >= THRESHOLD
}
