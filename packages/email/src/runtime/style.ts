/**
 * Inline-style helpers for email.
 *
 * Two jobs, both forced by the conformance data rather than by taste:
 *
 *  - **`rem` is blocked.** `css-unit-rem` reports `n` in Outlook Windows and Yahoo, and the
 *    whole cascivo token set is authored in `rem`. Every length that reaches an email must
 *    therefore be converted to `px` at render time.
 *  - **Bytes are the budget.** Gmail clips at ~102 KB of *encoded* body, so the serializer
 *    drops declarations with no value and never emits decorative whitespace.
 */

/** A React inline-style object, narrowed to what these primitives actually set. */
export type Style = Record<string, string | number | undefined>

/** Root font size assumed when converting `rem`. 16px is the CSS initial value. */
const ROOT_PX = 16

/**
 * Convert `rem` lengths to `px`, leaving every other unit alone.
 *
 * Applies to whole values, so `0 1rem` and `calc(100% - 0.5rem)` both convert. Rounds to a
 * tenth of a pixel: `0.375rem` is exactly 6px, but `0.8125rem` is 13.0000…px and printing
 * seventeen digits of it would cost bytes for no visual difference.
 */
export function remToPx(value: string): string {
  return value.replace(/(-?[\d.]+)rem\b/g, (_, n: string) => {
    const px = Number.parseFloat(n) * ROOT_PX
    return `${Number.isInteger(px) ? px : Math.round(px * 10) / 10}px`
  })
}

/** `fontSize` → `font-size`. */
function kebab(property: string): string {
  return property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
}

/**
 * Serialize a style object to a `style` attribute value.
 *
 * Exported for the renderer and the structural tests; primitives normally hand the object
 * straight to React, which does its own serialization. Keeping one implementation here
 * means the byte accounting and the `rem` conversion cannot disagree between the two paths.
 */
export function serialize(style: Style): string {
  return Object.entries(style)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${kebab(k)}:${remToPx(String(v))}`)
    .join(';')
}

/**
 * Merge style objects left to right, later winning.
 *
 * `undefined` entries are dropped rather than overriding, so a caller passing
 * `{ color: undefined }` does not blank an inherited colour.
 */
export function merge(...styles: (Style | undefined)[]): Style {
  const out: Style = {}
  for (const style of styles) {
    if (!style) continue
    for (const [k, v] of Object.entries(style)) {
      if (v !== undefined) out[k] = v
    }
  }
  return out
}

/**
 * Normalize every length in a style object from `rem` to `px`.
 *
 * React serializes the object itself, so the conversion has to happen before it is handed
 * over — `style={{ padding: '1rem' }}` would otherwise reach the client verbatim.
 */
export function px(style: Style): Style {
  const out: Style = {}
  for (const [k, v] of Object.entries(style)) {
    if (v === undefined) continue
    out[k] = typeof v === 'string' ? remToPx(v) : v
  }
  return out
}
