/**
 * Squeeze the rendered HTML.
 *
 * Owned rather than delegated to a minifier package for the usual reason — this package
 * ships no runtime dependencies — and because a general HTML minifier does not know the two
 * things that matter here: MSO conditional comments must survive, and inter-tag whitespace
 * is only safe to drop between block elements.
 */

/** Elements whose surrounding whitespace is never rendered, so it is free to remove. */
const BLOCK = 'html|head|meta|title|body|table|thead|tbody|tfoot|tr|td|th|ul|ol|li|div|p|h[1-6]'

/**
 * Collapse whitespace that cannot affect layout.
 *
 * Whitespace between two *inline* elements is significant — removing it joins words — so
 * only the block boundaries above are touched. Comments are stripped except conditional
 * ones (`<!--[if …]>`), which are load-bearing for Outlook and must be preserved byte for
 * byte.
 */
export function minify(html: string): string {
  return (
    html
      // Preserve conditional comments; drop the rest.
      .replace(/<!--(?!\[if)(?!<!\[endif)[\s\S]*?-->/g, '')
      // Whitespace between block-level tags.
      .replace(new RegExp(`(</?(?:${BLOCK})\\b[^>]*>)\\s+(<)`, 'gi'), '$1$2')
      .replace(new RegExp(`(>)\\s+(</?(?:${BLOCK})\\b)`, 'gi'), '$1$2')
      // Runs of whitespace inside a tag (between attributes).
      .replace(/\s{2,}(?=[^<]*>)/g, ' ')
      .trim()
  )
}
