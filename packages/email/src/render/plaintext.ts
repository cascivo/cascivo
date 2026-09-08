/**
 * Derive the plain-text alternative from the rendered HTML.
 *
 * Every email should carry one: some clients are text-only, some readers prefer it, and a
 * missing text part is a documented spam-filter signal. Written here rather than taken from
 * `html-to-text` because the input is not arbitrary HTML — it is our own generator's output,
 * whose shape this module can rely on, and the alternative is a dependency in a package that
 * otherwise has none.
 */

/** Block-level tags that should produce a line break in the text version. */
const BLOCKS = /<\/(p|div|tr|table|h[1-6]|li|ul|ol|td)\s*>/gi

const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#x27;': "'",
  '&#39;': "'",
}

/**
 * Convert to text, keeping link targets.
 *
 * A bare anchor label loses the destination, which is exactly what a text-only reader needs
 * most — so `<a href="x">y</a>` becomes `y (x)`. A link whose label already *is* the URL is
 * left alone rather than duplicated.
 */
export function toPlainText(html: string): string {
  let out = html
    // Preview text is hidden by construction and must not appear twice.
    .replace(/<div style="[^"]*display:none[^"]*"[\s\S]*?<\/div>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, label: string) => {
      const text = label.replace(/<[^>]+>/g, '').trim()
      return text && text !== href ? `${text} (${href})` : href
    })
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(BLOCKS, '\n')
    .replace(/<[^>]+>/g, '')

  for (const [entity, char] of Object.entries(ENTITIES)) {
    out = out.replaceAll(entity, char)
  }

  return (
    out
      // Zero-width preview padding would otherwise survive as invisible junk.
      .replace(/[​⁠]/g, '')
      .split('\n')
      .map((line) => line.replace(/[ \t]+/g, ' ').trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  )
}
