/**
 * Font stacks that survive an email client.
 *
 * `--cascivo-font-sans` starts with `ui-sans-serif, system-ui` — CSS-wide keywords that
 * resolve to a real face in a browser and to nothing in Outlook Windows, which falls back
 * to Times New Roman. Web fonts are no help either: `@font-face` does not load in Gmail or
 * Outlook, so the stack has to name faces that are already installed.
 *
 * These are the conventional email-safe stacks: an Apple face first (Apple Mail, iOS), then
 * a Microsoft face (Outlook Windows), then a generic. Nothing here needs to load.
 *
 * ## Why the stack is repeated on every element
 *
 * `Body` sets `font-family`, and in a browser that would be the end of it. Outlook Windows
 * is the Word rendering engine, and Word does not carry an inherited `font-family` into
 * table content — which, since every layout primitive here is a table, is all of the
 * content. An element that states no face renders in Times New Roman there. So each text
 * primitive restates the stack, and that repetition is load-bearing rather than sloppy.
 *
 * It is also the single largest line in the byte budget: one reported newsletter spent
 * 15 KB — 20% of the message — on 162 copies of the default stack. The lever for that is
 * the *length* of the stack, not the number of copies, which is what
 * `--cascivo-email-font-*` below exists to give you.
 */
import { optionalToken } from './palette.ts'

export const EMAIL_FONTS = {
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  serif: "Georgia, Cambria, 'Times New Roman', Times, serif",
  mono: "'SF Mono', Menlo, Consolas, 'Courier New', monospace",
} as const

export type FontFamily = keyof typeof EMAIL_FONTS

/**
 * The palette keys {@link fontStack} reads.
 *
 * These are **not** CSS custom properties and are deliberately not declared in
 * `@cascivo/tokens`. Nothing in a browser would read them, so declaring them there would
 * ship three inert declarations to every adopter's stylesheet — which, when it was tried,
 * pushed that file past its own gzip budget. They exist only as keys on the `Palette`
 * object an email render is given.
 *
 * Spelled out rather than built from a template so the names are greppable, and so
 * `scripts/checks/doc-tokens.test.ts` can read them from here and still hold the guides to
 * a real spelling.
 */
export const EMAIL_FONT_TOKENS = {
  sans: '--cascivo-email-font-sans',
  serif: '--cascivo-email-font-serif',
  mono: '--cascivo-email-font-mono',
} as const

/**
 * Family names that mean nothing to an email client.
 *
 * The `ui-*` and `system-ui` generics are the reason the browser token cannot simply be
 * used as-is: they resolve to the platform UI face in a browser and to *nothing* in
 * Outlook Windows, where an unresolvable first entry costs a fallback step for no gain.
 * The CSS-wide keywords are here because they are not family names at all — one of them
 * inside a list makes the whole declaration invalid.
 */
const UNUSABLE = new Set([
  'ui-sans-serif',
  'ui-serif',
  'ui-monospace',
  'ui-rounded',
  'system-ui',
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
])

/** Split a font-family list on its top-level commas, leaving quoted names intact. */
function families(value: string): string[] {
  const out: string[] = []
  let quote: string | null = null
  let start = 0
  for (let i = 0; i < value.length; i += 1) {
    const c = value[i]
    if (quote) {
      if (c === quote) quote = null
    } else if (c === '"' || c === "'") {
      quote = c
    } else if (c === ',') {
      out.push(value.slice(start, i))
      start = i + 1
    }
  }
  out.push(value.slice(start))
  return out.map((f) => f.trim()).filter(Boolean)
}

/**
 * Drop the entries an email client cannot use from a browser-authored stack.
 *
 * Returns `undefined` when nothing usable is left, so the caller falls back to a known-good
 * stack rather than emitting an empty `font-family` — which would drop the declaration and
 * hand the element back to the client's default face.
 */
export function emailSafeStack(value: string): string | undefined {
  const kept = families(value).filter((f) => !UNUSABLE.has(f.toLowerCase().replaceAll(/['"]/g, '')))
  return kept.length > 0 ? kept.join(', ') : undefined
}

/**
 * The email-safe stack for a cascivo font token.
 *
 * Reads the matching {@link EMAIL_FONT_TOKENS} key from the palette in scope, falling back
 * to {@link EMAIL_FONTS}. No shipped theme sets one, so the fallback is the default and
 * nothing changes until you opt in.
 *
 * The key is deliberately its own name rather than the browser's `--cascivo-font-<family>`:
 *
 *  - the browser token is authored for a browser, and its leading `ui-sans-serif, system-ui`
 *    are exactly the entries an email client cannot use — reading it directly would make
 *    every existing theme's email render worse, silently;
 *  - a stack for email is a different design decision from a stack for a page, taken against
 *    a different set of installed faces and a byte budget. Naming it separately means an
 *    adopter states it once, on purpose, rather than discovering that a branding change made
 *    in a stylesheet also changed what Outlook renders.
 *
 * Set it on a `Palette` passed to `renderEmail({ theme })` to rebrand — or to shrink. A
 * three-name stack costs ~60 bytes less per text element than the default, which on a large
 * newsletter is the difference between clipping and not:
 *
 * ```ts
 * renderEmail(<Newsletter />, {
 *   theme: { ...PALETTES.light, '--cascivo-email-font-sans': 'Arial, sans-serif' },
 * })
 * ```
 *
 * Whatever the token says is passed through {@link emailSafeStack}, so pasting a browser
 * stack in still yields something an email client can use.
 */
export function fontStack(family: FontFamily = 'sans'): string {
  const override = optionalToken(EMAIL_FONT_TOKENS[family])
  return (override === undefined ? undefined : emailSafeStack(override)) ?? EMAIL_FONTS[family]
}
