/**
 * Where the bytes went.
 *
 * A size gauge tells you an email is 8 KB; it does not tell you what to cut. This does, and
 * it is the other half of `docs/specs/email-target.md` §6's requirement that the output be
 * not merely small but **clear**.
 *
 * Attribution is by *what the bytes are* rather than by component. `renderToStaticMarkup`
 * erases component boundaries — the output is one flat string with no marker saying where
 * `Button` ended — so a per-component figure would have to come from rendering each
 * component alone, which double-counts shared wrappers and misattributes nesting. Splitting
 * markup from inline styles from text is both honest and more actionable: in practice the
 * answer is almost always "inline styles on nested tables", and this says so with numbers.
 */
import { styleAttributes } from '../conformance/css-attr.ts'

const UTF8 = new TextEncoder()

function bytes(s: string): number {
  return UTF8.encode(s).length
}

export interface TagCost {
  tag: string
  count: number
  /** Bytes spent on this tag's opening and closing tags, attributes included. */
  bytes: number
}

export interface Analysis {
  total: number
  /** Bytes inside `style="…"` attributes. Usually the largest share by a wide margin. */
  inlineStyles: number
  /** Bytes of tags and attributes, excluding inline styles. */
  markup: number
  /** Bytes of visible text content. */
  text: number
  /** Everything else — the doctype and Outlook conditional comments. */
  overhead: number
  /** Per-tag cost, largest first. */
  byTag: TagCost[]
  /** The most repeated declaration, with what removing every copy would save. */
  repeatedDeclarations: { declaration: string; count: number; bytes: number }[]
}

/**
 * Break a rendered email down by cost.
 *
 * The `repeatedDeclarations` list is the practically useful output: a font stack repeated
 * on forty elements is the single biggest saving available in most templates, and it is
 * invisible in a total.
 */
export function analyze(html: string): Analysis {
  const total = bytes(html)

  const styles = styleAttributes(html)
  const inlineStyles = styles.reduce((n, css) => n + bytes(css), 0)

  const tags = [...html.matchAll(/<\/?([a-z][\w-]*)\b[^>]*>/gi)]
  const markup = tags.reduce((n, m) => n + bytes(m[0]), 0) - inlineStyles

  const text = bytes(
    html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' '),
  )

  const counts = new Map<string, TagCost>()
  for (const m of tags) {
    const tag = m[1]!.toLowerCase()
    const entry = counts.get(tag) ?? { tag, count: 0, bytes: 0 }
    entry.count += 1
    entry.bytes += bytes(m[0])
    counts.set(tag, entry)
  }

  const declarations = new Map<string, number>()
  for (const css of styles) {
    for (const decl of css.split(';')) {
      const trimmed = decl.trim()
      if (trimmed) declarations.set(trimmed, (declarations.get(trimmed) ?? 0) + 1)
    }
  }

  return {
    total,
    inlineStyles,
    markup,
    text,
    overhead: Math.max(0, total - inlineStyles - markup - text),
    byTag: [...counts.values()].sort((a, b) => b.bytes - a.bytes),
    repeatedDeclarations: [...declarations.entries()]
      .filter(([, count]) => count > 1)
      .map(([declaration, count]) => ({ declaration, count, bytes: bytes(declaration) * count }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 10),
  }
}

/** Render an {@link Analysis} as plain text, for a terminal or a log. */
export function formatAnalysis(analysis: Analysis): string {
  const kb = (n: number) => `${(n / 1024).toFixed(2)} KB`
  const pct = (n: number) => `${((n / analysis.total) * 100).toFixed(0)}%`

  const lines = [
    `total          ${kb(analysis.total)}`,
    `  inline CSS   ${kb(analysis.inlineStyles)}  ${pct(analysis.inlineStyles)}`,
    `  markup       ${kb(analysis.markup)}  ${pct(analysis.markup)}`,
    `  text         ${kb(analysis.text)}  ${pct(analysis.text)}`,
    `  overhead     ${kb(analysis.overhead)}  ${pct(analysis.overhead)}`,
    '',
    'by tag',
    ...analysis.byTag
      .slice(0, 8)
      .map((t) => `  ${t.tag.padEnd(8)} ×${String(t.count).padEnd(4)} ${kb(t.bytes)}`),
    '',
    'most repeated declarations',
    ...analysis.repeatedDeclarations
      .slice(0, 5)
      .map((d) => `  ×${String(d.count).padEnd(4)} ${kb(d.bytes)}  ${d.declaration}`),
  ]
  return lines.join('\n')
}
