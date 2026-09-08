/**
 * Colour maths for the email render target.
 *
 * Email clients do not support `oklch()` — cascivo's entire palette is authored in it
 * (852 occurrences across `packages/tokens/src/index.css` and `packages/themes/src/*.css`).
 * Every colour that reaches an email must therefore be resolved to sRGB hex at build time.
 *
 * Hand-rolled rather than taken from a colour library, for two reasons the dependency policy
 * cares about: this runs at build time in a package whose whole point is to ship no runtime
 * dependencies, and the gamut-mapping step below is the part that decides whether a vivid
 * theme (cyberpunk, arcade) survives the trip — it deserves to be readable in-tree rather
 * than delegated.
 *
 * References: Björn Ottosson's OKLab derivation, and CSS Color 4 §13.2 for gamut mapping.
 */

/** A colour resolved to sRGB. Channels are 0–255 integers; `alpha` is 0–1. */
export interface Rgb {
  r: number
  g: number
  b: number
  alpha: number
}

export interface Oklch {
  l: number
  c: number
  h: number
  alpha: number
}

/** Just-noticeable difference in OKLab, per CSS Color 4 §13.2. */
const JND = 0.02

/** Half of one 8-bit channel step — the point below which clipping is invisible. */
const EPSILON = 0.0001

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

/** OKLCh → OKLab. Hue is degrees. */
function oklchToOklab(l: number, c: number, h: number): [number, number, number] {
  const rad = (h * Math.PI) / 180
  return [l, c * Math.cos(rad), c * Math.sin(rad)]
}

/** OKLab → linear-light sRGB. Channels may fall outside 0–1 when out of gamut. */
function oklabToLinearSrgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b

  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

/** Linear-light sRGB → OKLab. The inverse of {@link oklabToLinearSrgb}. */
function linearSrgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)

  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

/** sRGB transfer function — linear-light to gamma-encoded. */
function encodeGamma(x: number): number {
  const sign = x < 0 ? -1 : 1
  const abs = Math.abs(x)
  return abs <= 0.0031308 ? 12.92 * x : sign * (1.055 * abs ** (1 / 2.4) - 0.055)
}

/** sRGB transfer function — gamma-encoded to linear-light. */
function decodeGamma(x: number): number {
  const sign = x < 0 ? -1 : 1
  const abs = Math.abs(x)
  return abs <= 0.04045 ? x / 12.92 : sign * ((abs + 0.055) / 1.055) ** 2.4
}

function inGamut([r, g, b]: [number, number, number]): boolean {
  return (
    r >= -EPSILON &&
    r <= 1 + EPSILON &&
    g >= -EPSILON &&
    g <= 1 + EPSILON &&
    b >= -EPSILON &&
    b <= 1 + EPSILON
  )
}

function deltaEOk(a: [number, number, number], b: [number, number, number]): number {
  const dL = a[0] - b[0]
  const da = a[1] - b[1]
  const db = a[2] - b[2]
  return Math.sqrt(dL * dL + da * da + db * db)
}

/**
 * OKLCh → sRGB, gamut-mapped.
 *
 * A colour outside the sRGB gamut cannot simply be clipped: clipping each channel
 * independently shifts hue, which is how a vivid accent turns a different colour rather
 * than merely a duller one. CSS Color 4 §13.2 instead reduces chroma by binary search
 * until the *clipped* result is within one JND of the unclipped one, preserving hue and
 * lightness. Roughly a dozen lines, and the difference is visible on the vivid themes.
 */
export function oklchToRgb(l: number, c: number, h: number, alpha = 1): Rgb {
  if (l >= 1) return { r: 255, g: 255, b: 255, alpha }
  if (l <= 0) return { r: 0, g: 0, b: 0, alpha }

  const toLinear = (chroma: number): [number, number, number] => {
    const [L, a, bb] = oklchToOklab(l, chroma, h)
    return oklabToLinearSrgb(L, a, bb)
  }

  let chroma = c
  if (!inGamut(toLinear(chroma))) {
    let low = 0
    let high = c
    // 24 halvings take the interval well below any 8-bit-visible chroma step.
    for (let i = 0; i < 24 && high - low > 1e-5; i += 1) {
      chroma = (low + high) / 2
      const linear = toLinear(chroma)
      if (inGamut(linear)) {
        low = chroma
        continue
      }
      const clipped: [number, number, number] = [
        clamp01(linear[0]),
        clamp01(linear[1]),
        clamp01(linear[2]),
      ]
      const delta = deltaEOk(
        linearSrgbToOklab(linear[0], linear[1], linear[2]),
        linearSrgbToOklab(clipped[0], clipped[1], clipped[2]),
      )
      if (delta < JND) break
      high = chroma
    }
  }

  const linear = toLinear(chroma)
  return {
    r: Math.round(clamp01(encodeGamma(linear[0])) * 255),
    g: Math.round(clamp01(encodeGamma(linear[1])) * 255),
    b: Math.round(clamp01(encodeGamma(linear[2])) * 255),
    alpha,
  }
}

/** sRGB → OKLCh. Used to mix two resolved colours in a perceptual space. */
export function rgbToOklch({ r, g, b, alpha }: Rgb): Oklch {
  const [L, a, bb] = linearSrgbToOklab(
    decodeGamma(r / 255),
    decodeGamma(g / 255),
    decodeGamma(b / 255),
  )
  const c = Math.sqrt(a * a + bb * bb)
  let h = (Math.atan2(bb, a) * 180) / Math.PI
  if (h < 0) h += 360
  return { l: L, c, h, alpha }
}

/**
 * Interpolate two colours in OKLCh, as `color-mix(in oklch, …)` does.
 *
 * `weight` is the proportion of `from` (a `color-mix` percentage / 100). Hue takes the
 * shorter arc, matching CSS Color 5's default `shorter hue` interpolation.
 */
export function mixOklch(from: Rgb, to: Rgb, weight: number): Rgb {
  const a = rgbToOklch(from)
  const b = rgbToOklch(to)
  const w = clamp01(weight)

  // A fully transparent endpoint carries no meaningful hue or chroma — CSS treats it as
  // "the other colour, faded". Interpolating its (arbitrary) hue would tint the result.
  const aHue = a.alpha === 0 ? b.h : a.h
  const bHue = b.alpha === 0 ? a.h : b.h
  let dh = bHue - aHue
  if (dh > 180) dh -= 360
  if (dh < -180) dh += 360

  const mixed = oklchToRgb(
    a.alpha === 0 ? b.l : b.alpha === 0 ? a.l : a.l * w + b.l * (1 - w),
    a.alpha === 0 ? b.c : b.alpha === 0 ? a.c : a.c * w + b.c * (1 - w),
    aHue + dh * (1 - w),
    a.alpha * w + b.alpha * (1 - w),
  )
  return mixed
}

function hex2(n: number): string {
  return n.toString(16).padStart(2, '0')
}

/**
 * Serialize for an email inline style.
 *
 * Opaque colours become `#rgb` or `#rrggbb` — three-digit form only when lossless, since
 * every byte counts against Gmail's clip threshold. A translucent colour has no hex form
 * that Outlook understands, so callers are expected to have composited it against a known
 * backdrop first; `rgba()` is emitted as a last resort and flagged by the conformance lint.
 */
export function toHex({ r, g, b, alpha }: Rgb): string {
  if (alpha < 1) return `rgba(${r}, ${g}, ${b}, ${Number(alpha.toFixed(3))})`
  const s = `${hex2(r)}${hex2(g)}${hex2(b)}`
  const short = s[0] === s[1] && s[2] === s[3] && s[4] === s[5]
  return short ? `#${s[0]}${s[2]}${s[4]}` : `#${s}`
}

/**
 * Composite a translucent colour over an opaque backdrop.
 *
 * Email has no reliable alpha compositing (Outlook ignores `rgba()` outright), so a
 * translucent token has to be flattened against the surface it will actually sit on
 * before it is serialized. Source-over, in linear light — averaging gamma-encoded
 * channels darkens midtones visibly.
 */
export function flatten(fg: Rgb, bg: Rgb): Rgb {
  if (fg.alpha >= 1) return { ...fg, alpha: 1 }
  const blend = (f: number, b: number): number =>
    Math.round(
      clamp01(
        encodeGamma(decodeGamma(f / 255) * fg.alpha + decodeGamma(b / 255) * (1 - fg.alpha)),
      ) * 255,
    )
  return { r: blend(fg.r, bg.r), g: blend(fg.g, bg.g), b: blend(fg.b, bg.b), alpha: 1 }
}

/** WCAG 2.2 relative luminance. */
export function luminance({ r, g, b }: Rgb): number {
  return (
    0.2126 * decodeGamma(r / 255) + 0.7152 * decodeGamma(g / 255) + 0.0722 * decodeGamma(b / 255)
  )
}

/**
 * WCAG 2.2 contrast ratio, 1–21.
 *
 * This exists because resolving the palette to sRGB *invalidates the repo's existing
 * contrast guards*, which assert against oklch lightness values. A palette that passed AA
 * in oklch can fail it after gamut mapping, and nothing else in the tree would notice —
 * see `scripts/checks/email-tokens.test.ts`, which is the guard that does.
 */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = luminance(a)
  const lb = luminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * CSS Color 5 `contrast-color()`: black or white, whichever reads better on `base`.
 *
 * The themes use this inside `@supports (color: contrast-color(red))` to pick a button
 * label colour, with a static `oklch(1 0 0)` fallback for browsers that lack it. Taking
 * that fallback would be wrong for email: on a dark theme whose accent is light, white
 * text on the accent is exactly the 2.66:1 failure the fallback exists to avoid, and no
 * email client will ever compute the upgrade itself. Resolving it here at build time gives
 * every client the value a modern browser would have computed.
 */
export function contrastColor(base: Rgb): Rgb {
  const white: Rgb = { r: 255, g: 255, b: 255, alpha: 1 }
  const black: Rgb = { r: 0, g: 0, b: 0, alpha: 1 }
  return contrastRatio(white, base) >= contrastRatio(black, base) ? white : black
}
