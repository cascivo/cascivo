/**
 * Lift every `Style` block into `<head>`.
 *
 * A component that needs a media query has no way to reach the document from where it
 * renders — React has no portal in a static render, and threading a "collect styles" channel
 * through twenty components would put it on every call site. So the block is emitted where
 * the component is, and moved here.
 *
 * Merging rather than concatenating matters: a template with four `Container`s emits four
 * identical width overrides, and an email pays for every byte twice over once the body is
 * quoted-printable encoded.
 */
import { HOIST_ATTRIBUTE } from '../components/style.tsx'

const BLOCK = new RegExp(`<style\\b[^>]*\\b${HOIST_ATTRIBUTE}\\b[^>]*>([\\s\\S]*?)</style>`, 'gi')

/**
 * Move hoistable `<style>` blocks into `<head>`, deduplicated, in first-appearance order.
 *
 * With no `</head>` to lift into — a fragment rendered on its own, which the preview does
 * while a template is half-written — the blocks are left exactly where they are. A `<style>`
 * in the body still applies in most clients, so the degraded case is a working email rather
 * than a lost rule.
 */
export function hoistStyles(html: string): string {
  const seen = new Set<string>()
  for (const match of html.matchAll(BLOCK)) {
    const css = match[1]!.trim()
    if (css) seen.add(css)
  }
  if (seen.size === 0) return html

  const head = html.indexOf('</head>')
  if (head === -1) return html

  const stripped = html.replace(BLOCK, '')
  const at = stripped.indexOf('</head>')
  const merged = `<style>${[...seen].join('')}</style>`
  return `${stripped.slice(0, at)}${merged}${stripped.slice(at)}`
}
