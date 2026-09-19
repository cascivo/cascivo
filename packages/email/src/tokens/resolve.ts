/**
 * Flatten cascivo's token graph into literal values an email client can read.
 *
 * Two transformations, in order:
 *
 *  1. **`var()` flattening.** `--cascivo-color-text: var(--cascivo-color-foreground)` is a
 *     runtime indirection with no email equivalent — Gmail and Outlook Windows support
 *     neither declaring nor reading a custom property. Every chain is followed to a
 *     literal here, at build time.
 *  2. **Colour resolution.** `oklch()` and `color-mix()` become sRGB hex.
 *
 * Values that are not colours (spacing, radii, font stacks) pass through flattened but
 * otherwise untouched; unit conversion is the renderer's job, not this module's, because
 * only the renderer knows whether a length lands somewhere `rem` is legal.
 */
import {
  contrastColor,
  flatten,
  mixOklch,
  oklchToRgb,
  rgbToOklch,
  toHex,
  type Oklch,
  type Rgb,
} from './color.ts'
import { extract, type RawTokens } from './extract.ts'

/** A theme flattened to literal values, keyed by custom-property name. */
export type Palette = Record<string, string>

const OKLCH = /^oklch\(([\s\S]*)\)$/i
const COLOR_MIX = /^color-mix\(\s*in\s+oklch\s*,([\s\S]*)\)$/i
const CONTRAST_COLOR = /^contrast-color\(([\s\S]*)\)$/i

/** `50%` → 0.5; a bare number passes through. */
function percent(raw: string): number {
  return raw.trim().endsWith('%') ? Number.parseFloat(raw) / 100 : Number.parseFloat(raw)
}

/**
 * Split a comma-separated argument list at depth zero.
 *
 * `color-mix(in oklch, oklch(0.5 0.1 20 / 30%) 45%, transparent)` has commas inside the
 * nested colour that must not split the outer list.
 */
function splitArgs(input: string): string[] {
  const out: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i]
    if (ch === '(') depth += 1
    else if (ch === ')') depth -= 1
    else if (ch === ',' && depth === 0) {
      out.push(input.slice(start, i))
      start = i + 1
    }
  }
  out.push(input.slice(start))
  return out.map((s) => s.trim()).filter(Boolean)
}

/**
 * `oklch(0.52 0.2 250 / 40%)` → an {@link Rgb}. Returns null if this is not an `oklch()`.
 *
 * Also handles relative colour syntax — `oklch(from <colour> 0.45 0.2 h)`, which the themes
 * use twelve times to derive hover and active variants from the accent. The channel
 * keywords `l`, `c`, `h` and `alpha` resolve against the origin colour. `calc()` inside a
 * channel is not supported and throws rather than guessing: nothing ships it today, and a
 * silently wrong hover colour is worse than a failed build.
 */
function parseOklch(value: string, resolveNested: (v: string) => Rgb | null): Rgb | null {
  const m = OKLCH.exec(value.trim())
  if (!m) return null

  let body = m[1]!.trim()
  let origin: Oklch | null = null

  if (/^from\s/i.test(body)) {
    const rest = body.slice(4).trim()
    // The origin colour is itself a colour function or keyword; take the balanced prefix.
    const originText = takeColorPrefix(rest)
    if (!originText) return null
    const originRgb = resolveNested(originText)
    if (!originRgb) return null
    origin = rgbToOklch(originRgb)
    body = rest.slice(originText.length).trim()
  }

  const [coords, alphaPart] = body.split('/')
  const parts = coords!.trim().split(/\s+/)
  if (parts.length < 3) return null

  const channel = (raw: string, key: 'l' | 'c' | 'h'): number => {
    if (raw.includes('calc(')) {
      throw new Error(`calc() inside a relative colour is not supported: ${value}`)
    }
    if (origin && (raw === key || raw === 'l' || raw === 'c' || raw === 'h')) {
      return origin[raw as 'l' | 'c' | 'h']
    }
    return key === 'l' ? percent(raw) : Number.parseFloat(raw)
  }

  const l = channel(parts[0]!, 'l')
  const c = channel(parts[1]!, 'c')
  const h = channel(parts[2]!, 'h')
  if (!Number.isFinite(l) || !Number.isFinite(c) || !Number.isFinite(h)) return null

  const alpha =
    alphaPart === undefined
      ? (origin?.alpha ?? 1)
      : alphaPart.trim() === 'alpha'
        ? (origin?.alpha ?? 1)
        : percent(alphaPart)
  return oklchToRgb(l, c, h, Number.isFinite(alpha) ? alpha : 1)
}

/** The leading balanced colour expression of `input` — a function call or a bare keyword. */
function takeColorPrefix(input: string): string | null {
  const fn = /^[a-z-]+\(/i.exec(input)
  if (!fn) {
    const word = /^[\w#-]+/.exec(input)
    return word ? word[0] : null
  }
  let depth = 0
  for (let i = fn[0].length - 1; i < input.length; i += 1) {
    if (input[i] === '(') depth += 1
    else if (input[i] === ')') {
      depth -= 1
      if (depth === 0) return input.slice(0, i + 1)
    }
  }
  return null
}

const TRANSPARENT: Rgb = { r: 0, g: 0, b: 0, alpha: 0 }

/** Parse any colour form the token files actually use. */
function parseColor(value: string): Rgb | null {
  const v = value.trim()
  if (v === 'transparent') return TRANSPARENT
  const direct = parseOklch(v, parseColor)
  if (direct) return direct

  const contrast = CONTRAST_COLOR.exec(v)
  if (contrast) {
    const base = parseColor(contrast[1]!.trim())
    return base ? contrastColor(base) : null
  }

  const mix = COLOR_MIX.exec(v)
  if (mix) {
    const args = splitArgs(mix[1]!)
    if (args.length !== 2) return null
    // Only the first operand carries an explicit percentage in the shipped CSS; CSS
    // gives the second the remainder, which is what the default 0.5 encodes.
    const firstMatch = /^(.*?)\s+([\d.]+%)$/.exec(args[0]!)
    const from = parseColor(firstMatch ? firstMatch[1]! : args[0]!)
    const to = parseColor(args[1]!)
    if (!from || !to) return null
    return mixOklch(from, to, firstMatch ? percent(firstMatch[2]!) : 0.5)
  }
  return null
}

/**
 * Resolve colour functions embedded in a compound value.
 *
 * Shadows and the focus ring are lists, not colours — `0 1px 3px oklch(0 0 0 / 0.07)` —
 * so `parseColor` rejects them wholesale and the `oklch()` would survive into the palette.
 * Most clients ignore `box-shadow` entirely, but a token carrying an unparseable colour
 * function is a landmine for any future consumer, and the conformance lint would rather
 * report `box-shadow` unsupported than `oklch` unrecognised.
 *
 * Alpha is preserved here rather than composited: a shadow's translucency is part of the
 * compound value, and there is no single backdrop it can be flattened against.
 */
function resolveEmbedded(value: string): string {
  let out = ''
  let i = 0
  while (i < value.length) {
    const next = /(oklch|color-mix|contrast-color)\(/i.exec(value.slice(i))
    if (!next) {
      out += value.slice(i)
      break
    }
    const at = i + next.index
    out += value.slice(i, at)
    const expr = takeColorPrefix(value.slice(at))
    if (!expr) {
      out += value.slice(at)
      break
    }
    const parsed = parseColor(expr)
    out += parsed ? toHex(parsed) : expr
    i = at + expr.length
  }
  return out
}

/**
 * Resolve one raw value to a literal, following `var()` chains.
 *
 * `seen` breaks reference cycles. A cycle is a bug in the token files rather than
 * something to paper over, so it throws — naming the token, because a cycle discovered
 * through a blank colour in an inbox is a bad way to find out.
 */
function flattenVars(value: string, raw: RawTokens, seen: Set<string>): string {
  return value.replace(
    /var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/g,
    (_, name: string, fallback?: string) => {
      if (seen.has(name)) {
        throw new Error(
          `Token cycle through ${name} — check packages/themes/src and packages/tokens/src`,
        )
      }
      const next = raw.get(name)
      if (next === undefined) {
        if (fallback !== undefined) return flattenVars(fallback.trim(), raw, seen)
        throw new Error(`Unknown token ${name} referenced with no fallback`)
      }
      seen.add(name)
      const out = flattenVars(next, raw, seen)
      seen.delete(name)
      return out
    },
  )
}

export interface ResolveOptions {
  /**
   * Backdrop for compositing translucent colours.
   *
   * Email has no dependable alpha: Outlook ignores `rgba()`, so a token like
   * `--cascivo-color-active-bg` (6% black) would render as fully opaque black there. Every
   * translucent colour is therefore flattened against the theme's own background before it
   * is serialized, which is correct wherever the token is used on that background — and is
   * why a component that needs a tint over some *other* surface must ask the renderer for
   * it rather than reading the palette directly.
   */
  background?: Rgb
}

/**
 * Flatten raw declarations into a palette of literal values.
 *
 * Colours become hex; everything else is returned with its `var()` chains resolved.
 */
export function resolvePalette(raw: RawTokens, options: ResolveOptions = {}): Palette {
  const backdrop = options.background ??
    parseColor(
      flattenVars(raw.get('--cascivo-color-background') ?? 'oklch(1 0 0)', raw, new Set()),
    ) ?? { r: 255, g: 255, b: 255, alpha: 1 }

  const palette: Palette = {}
  for (const name of [...raw.keys()].sort()) {
    const flat = flattenVars(raw.get(name)!, raw, new Set([name]))
    const colour = parseColor(flat)
    palette[name] = colour ? toHex(flatten(colour, backdrop)) : resolveEmbedded(flat)
  }
  return palette
}

/**
 * Build a palette from token CSS plus a theme's CSS, in cascade order.
 *
 * `tokensCss` supplies the primitives and the `:root` defaults; `themeCss` overrides the
 * semantic layer. Both are read as flat declaration streams, which is sound here because
 * a theme file only ever contains one theme's block — the twelve are separate files.
 */
export function buildPalette(
  tokensCss: string,
  themeCss: string,
  options?: ResolveOptions,
): Palette {
  const raw: RawTokens = new Map()
  extract(tokensCss, raw)
  extract(themeCss, raw)
  return resolvePalette(raw, options)
}
