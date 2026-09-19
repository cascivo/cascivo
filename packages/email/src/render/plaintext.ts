/**
 * Derive the plain-text alternative from the rendered HTML.
 *
 * Every email should carry one: some clients are text-only, some readers prefer it, and a
 * missing text part is a documented spam-filter signal. Written here rather than taken from
 * `html-to-text` because the input is not arbitrary HTML — it is our own generator's output,
 * whose shape this module can rely on — and because the alternative is a dependency in a
 * package that otherwise has none.
 *
 * The output is *structured* text, not tag-stripped soup. A receipt whose totals collapse
 * into one run of words is technically a text alternative and practically useless, so
 * headings are underlined, list items keep a marker, and rules survive as rules.
 */

/** Block-level tags that end a line. */
const BLOCKS = /<\/(p|div|tr|table|h[1-6]|li|ul|ol|td)\s*>/gi

const ENTITIES: [RegExp, string][] = [
  [/&nbsp;/g, ' '],
  [/&#x27;/gi, "'"],
  [/&#39;/g, "'"],
  [/&quot;/gi, '"'],
  [/&lt;/gi, '<'],
  [/&gt;/gi, '>'],
  // `&amp;` last: decoding it first would turn `&amp;lt;` into `<`.
  [/&amp;/gi, '&'],
]

export interface PlainTextOptions {
  /**
   * How a link's destination is carried into the text.
   *
   * - `'inline'` (default) — `label (https://…)`. A text-only reader needs the destination
   *   most, and putting it next to the label keeps the two associated.
   * - `'footnote'` — `label [1]`, with a numbered list at the end. Better for prose with
   *   many links, where inline URLs shred the paragraphs.
   * - `'strip'` — label only. For a digest whose links are all tracking URLs.
   */
  links?: 'inline' | 'footnote' | 'strip'
  /** Marker for `<li>` in an unordered list. Default `'- '`. */
  bullet?: string
  /**
   * Wrap column, or `0` for no wrapping. Default `78` — the conventional plain-text width,
   * which leaves room for two levels of `> ` quoting inside an 80-column reader.
   */
  width?: number
  /** Underline headings with `=` and `-`. Default true. */
  headings?: boolean
}

const DEFAULTS: Required<PlainTextOptions> = {
  links: 'inline',
  bullet: '- ',
  width: 78,
  headings: true,
}

function decode(text: string): string {
  let out = text
  for (const [pattern, char] of ENTITIES) out = out.replace(pattern, char)
  return out
}

/** Greedy wrap at `width`, never breaking a word. A long URL is left over-long on purpose. */
function wrap(line: string, width: number): string {
  if (width <= 0 || line.length <= width) return line
  const out: string[] = []
  let current = ''
  for (const word of line.split(' ')) {
    if (current && current.length + 1 + word.length > width) {
      out.push(current)
      current = word
    } else {
      current = current ? `${current} ${word}` : word
    }
  }
  if (current) out.push(current)
  return out.join('\n')
}

/**
 * Convert rendered email HTML to its text alternative.
 *
 * Two things are deliberately dropped: the hidden preheader (it would otherwise appear
 * twice, once as itself and once as the opening line) and anything marked
 * `data-skip-in-text` — the same escape hatch React Email offers, for content that only
 * makes sense visually.
 */
export function toPlainText(html: string, options: PlainTextOptions = {}): string {
  const { links, bullet, width, headings } = { ...DEFAULTS, ...options }
  const footnotes: string[] = []

  let out = html
    // The preheader is hidden by construction and must not appear twice.
    .replace(/<div style="[^"]*display:none[^"]*"[\s\S]*?<\/div>/gi, '')
    // Author-marked visual-only content, matching React Email's `data-skip-in-text`.
    .replace(/<([a-z]+)\b[^>]*\bdata-skip-in-text\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // The whole head, not just script/style. `<title>` is the subject restated, and it was
    // landing as a stray first line above the real heading — the same words twice, which is
    // exactly what a text alternative should not open with.
    .replace(/<head\b[\s\S]*?<\/head>/gi, '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')

  if (headings) {
    // Underline before the tags are stripped, while the level is still known.
    out = out.replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level: string, inner: string) => {
      const text = decode(inner.replace(/<[^>]+>/g, '')).trim()
      if (!text) return ''
      const rule = (level === '1' ? '=' : '-').repeat(Math.min(text.length, width || text.length))
      return `\n${text}\n${rule}\n`
    })
  }

  out = out
    .replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, label: string) => {
      const text = decode(label.replace(/<[^>]+>/g, '')).trim()
      if (links === 'strip') return text
      // A link whose label already IS the URL needs no second copy.
      if (!text || text === href) return href
      if (links === 'footnote') {
        const existing = footnotes.indexOf(href)
        const index = existing === -1 ? footnotes.push(href) : existing + 1
        return `${text} [${index}]`
      }
      return `${text} (${href})`
    })
    // A rule is content: it separates a receipt's total from its line items.
    .replace(/<td\b[^>]*border-top[^>]*>[\s\S]*?<\/td>/gi, '\n---\n')
    .replace(/<li\b[^>]*>/gi, `\n${bullet}`)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(BLOCKS, '\n')
    .replace(/<[^>]+>/g, '')

  out = decode(out)
    // Zero-width preheader padding would survive as invisible junk.
    .replace(/[​⁠]/g, '')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (width > 0)
    out = out
      .split('\n')
      .map((line) => wrap(line, width))
      .join('\n')

  if (footnotes.length > 0) {
    out += `\n\n${footnotes.map((href, i) => `[${i + 1}] ${href}`).join('\n')}`
  }

  return out
}

/**
 * The preheader an email declares, if any.
 *
 * Extracted from the rendered HTML rather than tracked through the render, because
 * `<Preview>` can appear anywhere in the tree and the document is the one place its presence
 * is certain. Returns `null` when the email has no preheader — which is worth knowing: the
 * client then shows the opening words of the body instead, and that is almost never what
 * anyone intended.
 */
export function extractPreheader(html: string): string | null {
  const m = /<div style="[^"]*display:none[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html)
  if (!m) return null
  const text = decode(m[1]!.replace(/<[^>]+>/g, ''))
    .replace(/[​⁠]/g, '')
    .trim()
  return text || null
}
