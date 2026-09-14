/**
 * Undo the two things `react-dom/server` does for a browser that an email does not want.
 *
 * Both are artefacts of the renderer rather than of anything a template author wrote, so
 * neither can be fixed in a primitive — they have to be corrected on the finished string.
 * They run on every render, `pretty` included, because both are correctness rather than
 * squeezing; `minify.ts` owns the squeezing.
 */

/**
 * Resource hints React 19 emits by itself.
 *
 * React's float/resource machinery hoists a `<link rel="preload" as="image">` into `<head>`
 * for every `<img>` it renders — five images, five links, with no way to opt out at the
 * element. In a browser that is a real optimisation. In an email it is dead weight twice
 * over: `html-link` is `n` in every Gmail and Yahoo platform plus Outlook.com and Outlook
 * mobile, and no client would act on the hint even where the element survives.
 *
 * The other hint rels are listed for the same reason — `prefetch`, `preconnect` and
 * `dns-prefetch` describe a navigation that an inbox will never perform. A `<link>` the
 * author wrote themselves (a stylesheet, an alternate) is left alone.
 */
const RESOURCE_HINT_RELS = ['preload', 'modulepreload', 'prefetch', 'preconnect', 'dns-prefetch']

const RESOURCE_HINT = new RegExp(
  `<link\\b[^>]*\\brel="(?:${RESOURCE_HINT_RELS.join('|')})"[^>]*>`,
  'gi',
)

/** Drop React's auto-emitted resource hints. */
export function stripResourceHints(html: string): string {
  return html.replace(RESOURCE_HINT, '')
}

/**
 * Spend two bytes on an apostrophe instead of twelve.
 *
 * React escapes `'` as `&#x27;` in every attribute value. That is the right default for a
 * renderer that cannot know how the attribute will be delimited, and it is pure cost here:
 * React writes attributes double-quoted, so a literal apostrophe inside one is unambiguous.
 *
 * It is not a rounding error at email scale. The `sans` stack names one quoted face, and a
 * template that repeats that stack on every text element — which Outlook Windows requires,
 * see `runtime/fonts.ts` — pays ten wasted bytes per element. One reported newsletter spent
 * ~1.9 KB of a 75 KB budget on it.
 *
 * Safe as a blind replacement: the sequence can only appear where React put it, since an
 * author writing the literal text `&#x27;` has it escaped to `&amp;#x27;`, which this does
 * not match. `&quot;` is deliberately left alone — that one is load-bearing.
 */
export function unescapeApostrophes(html: string): string {
  return html.replaceAll('&#x27;', "'")
}

/** Both corrections, in the order the renderer's output needs them. */
export function correctReactOutput(html: string): string {
  return unescapeApostrophes(stripResourceHints(html))
}
