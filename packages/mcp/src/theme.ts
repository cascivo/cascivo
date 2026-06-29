export interface ThemeColors {
  /** Main brand / interactive color (maps to the accent token family). */
  primary: string
  /** Base gray used to derive surfaces, borders, and text. */
  neutral: string
  /** Secondary highlight color (info / focus ring). */
  accent: string
}

/**
 * cascivo is an all-OKLCH system, and its first-party themes derive their state
 * variants via relative color syntax (`oklch(from var(--base) …)`) behind a
 * static fallback. This generator emits a theme built the *same* way — no
 * `color-mix` ladders, no hex literals — so an agent-generated theme is
 * indistinguishable in construction from the hand-authored ones.
 */

interface Oklch {
  l: number
  c: number
  h: number
  a?: number
}

// Minimal CSS named-color set (enough for human-typed inputs); everything else
// should be hex / rgb() / oklch().
const NAMED: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  gray: '#808080',
  grey: '#808080',
  silver: '#c0c0c0',
  maroon: '#800000',
  olive: '#808000',
  lime: '#00ff00',
  aqua: '#00ffff',
  teal: '#008080',
  navy: '#000080',
  fuchsia: '#ff00ff',
  purple: '#800080',
  orange: '#ffa500',
  yellow: '#ffff00',
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const round = (n: number, p: number) => {
  const f = 10 ** p
  return Math.round(n * f) / f
}

/** sRGB (0–1, gamma-encoded) → OKLCH. Ottosson's reference transform. */
function srgbToOklch(r: number, g: number, b: number): Oklch {
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const rl = lin(r)
  const gl = lin(g)
  const bl = lin(b)
  const l_ = Math.cbrt(0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl)
  const m_ = Math.cbrt(0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl)
  const s_ = Math.cbrt(0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl)
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_
  const C = Math.hypot(a, bb)
  let H = (Math.atan2(bb, a) * 180) / Math.PI
  if (H < 0) H += 360
  return { l: clamp(L, 0, 1), c: Math.max(0, C), h: H }
}

function hexToOklch(hex: string): Oklch {
  let h = hex.slice(1)
  if (h.length === 3) {
    h = h
      .split('')
      .map((ch) => ch + ch)
      .join('')
  }
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  return srgbToOklch(r, g, b)
}

/** Parse a hex / rgb() / oklch() / named color into OKLCH. Throws on unknown input. */
export function parseToOklch(input: string): Oklch {
  const raw = input.trim().toLowerCase()
  const named = NAMED[raw]
  if (named) return hexToOklch(named)
  if (raw.startsWith('#')) return hexToOklch(raw)

  const oklchM = /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/.exec(
    raw,
  )
  if (oklchM) {
    const parsePct = (s: string) => (s.endsWith('%') ? parseFloat(s) / 100 : parseFloat(s))
    const o: Oklch = {
      l: clamp(parsePct(oklchM[1]!), 0, 1),
      c: parseFloat(oklchM[2]!),
      h: parseFloat(oklchM[3]!),
    }
    if (oklchM[4]) o.a = parsePct(oklchM[4])
    return o
  }

  const rgbM = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(raw)
  if (rgbM) {
    return srgbToOklch(
      parseFloat(rgbM[1]!) / 255,
      parseFloat(rgbM[2]!) / 255,
      parseFloat(rgbM[3]!) / 255,
    )
  }

  throw new Error(
    `create_theme: cannot parse color "${input}" — use hex, rgb(), oklch(), or a named color`,
  )
}

/** Serialize OKLCH to a canonical `oklch(L C H[ / a])` literal. */
function fmt(o: Oklch): string {
  const base = `oklch(${round(o.l, 3)} ${round(o.c, 3)} ${round(o.h, 1)}`
  return o.a !== undefined ? `${base} / ${round(o.a, 3)})` : `${base})`
}

/** Apply a step to an OKLCH color (lightness/chroma deltas, optional alpha). */
function step(o: Oklch, d: { dl?: number; dc?: number; a?: number }): Oklch {
  const next: Oklch = {
    l: clamp(o.l + (d.dl ?? 0), 0, 1),
    c: Math.max(0, o.c * (d.dc ?? 1)),
    h: o.h,
  }
  if (d.a !== undefined) next.a = d.a
  return next
}

/**
 * Emit a fallback-then-derived declaration pair: the static OKLCH literal first
 * (what every browser uses), then the relative-color form (progressive). Both
 * are computed from the same base + delta so they agree.
 */
function derive(
  prop: string,
  baseToken: string,
  base: Oklch,
  d: { dl?: number; dc?: number; a?: number },
): string {
  const fallback = fmt(step(base, d))
  const lExpr = d.dl ? `calc(l ${d.dl >= 0 ? '+' : '-'} ${Math.abs(d.dl)})` : 'l'
  const cExpr = d.dc !== undefined && d.dc !== 1 ? `calc(c * ${d.dc})` : 'c'
  const alpha = d.a !== undefined ? ` / ${d.a}` : ''
  const rel = `oklch(from var(${baseToken}) ${lExpr} ${cExpr} h${alpha})`
  return `    ${prop}: ${fallback};\n    ${prop}: ${rel};\n`
}

/** A plain static OKLCH literal declaration (no derivation). */
function lit(prop: string, o: Oklch): string {
  return `    ${prop}: ${fmt(o)};\n`
}

/**
 * Pick a WCAG-safe on-color (used as the static fallback for contrast-color()):
 * dark text on light surfaces, light text on dark ones.
 */
function onColor(base: Oklch): Oklch {
  return base.l > 0.6 ? { l: 0.145, c: 0.005, h: base.h } : { l: 1, c: 0, h: 0 }
}

// In-system OKLCH status constants (the OKLCH equivalents of the previous hex
// #dc2626 / #16a34a / #f59e0b — computed once, never hex in the output).
const DESTRUCTIVE: Oklch = { l: 0.577, c: 0.215, h: 27.3 }
const SUCCESS: Oklch = { l: 0.627, c: 0.176, h: 149.6 }
const WARNING: Oklch = { l: 0.769, c: 0.166, h: 70.7 }

/**
 * Generate a custom cascivo theme as CSS. Maps the three input colors onto the
 * semantic token layer via OKLCH relative color syntax + contrast-color(), each
 * behind a static OKLCH fallback. Component tokens inherit automatically.
 */
export function generateThemeCss(colors: ThemeColors, name = 'custom'): string {
  const primary = parseToOklch(colors.primary)
  const neutral = parseToOklch(colors.neutral)
  const accent = parseToOklch(colors.accent)

  const surface = (l: number, cMul = 0.15): Oklch => ({
    l,
    c: round(neutral.c * cMul, 3),
    h: neutral.h,
  })
  const onAccent = onColor(primary)
  const onDestructive = onColor(DESTRUCTIVE)

  return `/* cascivo — Generated theme: ${name} */
/* Built like the first-party themes: OKLCH + relative color syntax + */
/* contrast-color(), every progressive value behind a static fallback. */

@layer cascivo.theme {
  [data-theme='${name}'] {
    color-scheme: light;

    /* ── Surface (derived from neutral) ───────────────── */
${lit('--cascivo-color-bg', surface(0.99))}${lit('--cascivo-color-bg-subtle', surface(0.975))}${lit('--cascivo-color-surface', surface(0.985))}${lit('--cascivo-color-surface-raised', surface(0.97))}${lit('--cascivo-color-surface-overlay', surface(0.99))}${lit('--cascivo-color-border', surface(0.9, 0.25))}${lit('--cascivo-color-border-strong', surface(0.8, 0.3))}
    /* ── Text (derived from neutral) ──────────────────── */
${lit('--cascivo-color-text', surface(0.22, 0.4))}${lit('--cascivo-color-text-subtle', surface(0.45, 0.35))}${lit('--cascivo-color-text-muted', surface(0.6, 0.3))}
    /* on-color: static fallback then auto-contrast (WCAG) */
    --cascivo-color-text-on-accent: ${fmt(onAccent)};
    --cascivo-color-text-on-accent: contrast-color(var(--cascivo-color-accent));
    --cascivo-color-text-on-destructive: ${fmt(onDestructive)};
    --cascivo-color-text-on-destructive: contrast-color(var(--cascivo-color-destructive));

    /* ── Accent / primary interactive (derived from one base) ── */
${lit('--cascivo-color-accent', primary)}${derive('--cascivo-color-accent-hover', '--cascivo-color-accent', primary, { dl: -0.077 })}${derive('--cascivo-color-accent-active', '--cascivo-color-accent', primary, { dl: -0.154 })}${derive('--cascivo-color-accent-subtle', '--cascivo-color-accent', primary, { a: 0.1 })}${derive('--cascivo-color-accent-muted', '--cascivo-color-accent', primary, { a: 0.2 })}
    /* ── Secondary accent (info / focus) ──────────────── */
${lit('--cascivo-color-info', accent)}${derive('--cascivo-color-info-subtle', '--cascivo-color-info', accent, { a: 0.1 })}${lit('--cascivo-color-focus-ring', accent)}
    /* ── Status (in-system OKLCH; no hex) ─────────────── */
${lit('--cascivo-color-destructive', DESTRUCTIVE)}${derive('--cascivo-color-destructive-hover', '--cascivo-color-destructive', DESTRUCTIVE, { dl: -0.077 })}${derive('--cascivo-color-destructive-subtle', '--cascivo-color-destructive', DESTRUCTIVE, { a: 0.1 })}${lit('--cascivo-color-success', SUCCESS)}${derive('--cascivo-color-success-subtle', '--cascivo-color-success', SUCCESS, { a: 0.1 })}${lit('--cascivo-color-warning', WARNING)}${derive('--cascivo-color-warning-subtle', '--cascivo-color-warning', WARNING, { a: 0.1 })}  }
}
`
}
