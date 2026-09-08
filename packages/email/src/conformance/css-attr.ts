/**
 * Read and write the CSS inside a `style="…"` attribute.
 *
 * Shared by the linter and the client simulator because both got this wrong in the same
 * way, and the failure was invisible in unit tests: a style attribute is **HTML-escaped**,
 * so a font stack arrives as
 * `font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, …`. Splitting that
 * on `;` cuts through the `&#x27;` entity — which ends in a semicolon — and produces a
 * truncated font stack plus a run of fragments with no colon in them.
 *
 * The simulator then wrote the corrupted CSS back, and the preview rendered every email in
 * Times New Roman under client simulation. Nothing in the test suite noticed, because the
 * fixtures asserted on `slug` values and never on the reconstructed declaration text; it
 * took driving the preview in a real browser to see it.
 *
 * So: decode once, work on real CSS, re-encode on the way out.
 */

const DECODE: [RegExp, string][] = [
  [/&#x27;/gi, "'"],
  [/&#39;/g, "'"],
  [/&quot;/gi, '"'],
  [/&lt;/gi, '<'],
  [/&gt;/gi, '>'],
  // `&amp;` last: decoding it first would turn `&amp;#x27;` into an apostrophe.
  [/&amp;/gi, '&'],
]

export function decodeAttribute(value: string): string {
  let out = value
  for (const [pattern, char] of DECODE) out = out.replace(pattern, char)
  return out
}

/** Inverse of {@link decodeAttribute}. `&` first, for the same reason it is decoded last. */
export function encodeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#x27;')
}

export interface Declaration {
  property: string
  value: string
}

/**
 * Split decoded CSS into declarations.
 *
 * Splits at depth zero only, so a `;` inside `url(…)` or a nested function does not end a
 * declaration. Entities are already gone by this point, but the depth check costs nothing
 * and removes the next variant of the same class of bug.
 */
export function parseDeclarations(css: string): Declaration[] {
  const out: Declaration[] = []
  let depth = 0
  let start = 0
  const push = (chunk: string) => {
    const at = chunk.indexOf(':')
    if (at === -1) return
    const property = chunk.slice(0, at).trim()
    const value = chunk.slice(at + 1).trim()
    if (property && value) out.push({ property, value })
  }
  for (let i = 0; i < css.length; i += 1) {
    const ch = css[i]
    if (ch === '(') depth += 1
    else if (ch === ')') depth -= 1
    else if (ch === ';' && depth === 0) {
      push(css.slice(start, i))
      start = i + 1
    }
  }
  push(css.slice(start))
  return out
}

export function serializeDeclarations(declarations: Declaration[]): string {
  return declarations.map((d) => `${d.property}:${d.value}`).join(';')
}

/** Every `style="…"` attribute in a document, decoded. */
export function styleAttributes(html: string): string[] {
  return [...html.matchAll(/\sstyle="([^"]*)"/gi)].map((m) => decodeAttribute(m[1]!))
}
