/**
 * Pull `--cascivo-*` declarations out of the shipped token and theme CSS.
 *
 * Deliberately a scanner rather than a CSS parser. The input is not arbitrary CSS — it is
 * two files this repo controls, whose custom properties are all simple `--name: value;`
 * declarations. A parser would be more code and no more correct, and `pnpm regen`'s drift
 * check would catch any input shape this cannot read.
 *
 * The one construct that must be understood rather than skipped is `@supports`: the themes
 * use it to upgrade a static colour to `contrast-color()` on browsers that have it
 * (`packages/themes/src/light.css`). No email client does, so the *static fallback* is the
 * value email wants — which means every `@supports` block has to be dropped before
 * scanning, or the progressive value would win by source order.
 */

/** One resolved-at-source declaration, before `var()` chains are flattened. */
export type RawTokens = Map<string, string>

/**
 * Remove every `@supports` block, braces balanced.
 *
 * Retained for callers that want only statically-supported values, and exercised by
 * `extract.test.ts` — but **not used by the default extraction path**. Every `@supports`
 * block the theme system ships (all twelve of them) is
 * `@supports (color: contrast-color(red))`, and the resolver evaluates `contrast-color()`
 * itself. Taking the progressive value is therefore strictly better for email: it is the
 * colour a modern browser computes, which is more accessible than the conservative static
 * fallback, and it costs an email client nothing because the value arrives pre-resolved.
 *
 * `packages/themes/src/light.css` nests a `& { … }` rule inside its `@supports`, so a
 * non-greedy match to the first `}` would leave the inner declarations behind.
 */
export function stripSupports(css: string): string {
  let out = ''
  let i = 0
  while (i < css.length) {
    const at = css.indexOf('@supports', i)
    if (at === -1) {
      out += css.slice(i)
      break
    }
    out += css.slice(i, at)
    const open = css.indexOf('{', at)
    if (open === -1) break
    let depth = 0
    let j = open
    for (; j < css.length; j += 1) {
      if (css[j] === '{') depth += 1
      else if (css[j] === '}') {
        depth -= 1
        if (depth === 0) break
      }
    }
    i = j + 1
  }
  return out
}

/** Strip `/* … *​/` comments so a commented-out declaration is never read as live. */
export function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

/**
 * Scan declarations in source order.
 *
 * Later declarations win, which is what the cascade does for two rules of equal
 * specificity in the same layer — and, more to the point, is what makes a theme file's
 * `[data-theme='dark']` block override the `:root` defaults it was appended to. It is also
 * what lets a `@supports` upgrade beat the static fallback declared above it; see
 * {@link stripSupports} for why that is the value email wants.
 */
export function extract(css: string, into: RawTokens = new Map()): RawTokens {
  const clean = stripComments(css)
  const re = /(--cascivo-[\w-]+)\s*:\s*([^;{}]+);/g
  let m: RegExpExecArray | null
  while ((m = re.exec(clean)) !== null) {
    into.set(m[1]!, m[2]!.replace(/\s+/g, ' ').trim())
  }
  return into
}
