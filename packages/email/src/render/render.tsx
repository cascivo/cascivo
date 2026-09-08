/**
 * `renderEmail` — the whole email target's entry point.
 *
 * Returns the HTML, its plain-text twin, and the size accounting that makes the byte budget
 * checkable rather than aspirational (`docs/specs/email-target.md` §6).
 */
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import { withPalette } from '../runtime/palette.ts'
import { PALETTES, type EmailTheme } from '../tokens/palettes.generated.ts'
import type { Palette } from '../tokens/resolve.ts'
import { toPlainText } from './plaintext.ts'
import { minify } from './minify.ts'

/**
 * `TextEncoder`, not `Buffer`.
 *
 * `Buffer` is Node-only, and this package is rendered in a browser too — the preview app
 * calls `renderEmail` client-side for instant feedback. Using `Buffer` here threw
 * "Buffer is not defined" and took the whole preview down with it.
 */
const UTF8 = new TextEncoder()

/**
 * XHTML 1.0 Transitional.
 *
 * Not a stylistic choice: Outlook Windows switches to a quirks-mode box model without it,
 * and every stated width in the email is then wrong by the border and padding.
 */
const DOCTYPE =
  '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'

/**
 * Gmail's clip thresholds, in bytes of encoded message body.
 *
 * Desktop is the widely-reproduced ~102 KB. The mobile figures are lower and less firmly
 * documented, which is why `strict` exists as a separate tier rather than as the default
 * for everything: a template that must survive iOS Gmail opts into it.
 */
export const CLIP_BUDGETS = {
  /** Desktop Gmail. */
  standard: 102 * 1024,
  /** Non-iOS mobile clients, reported around 75 KB. */
  mobile: 75 * 1024,
  /** iOS Gmail, reported around 20 KB. The tier a transactional template should target. */
  strict: 20 * 1024,
} as const

export type ClipTier = keyof typeof CLIP_BUDGETS
export type ClipRisk = 'ok' | 'warn' | 'over'

export interface RenderStats {
  /** Raw UTF-8 bytes of the HTML. */
  bytes: number
  /**
   * Bytes after transfer encoding — what Gmail actually measures.
   *
   * Budgeting against `bytes` under-reports by up to a third and is the single most common
   * way a size check passes while the delivered mail is clipped.
   */
  encodedBytes: number
  clipRisk: ClipRisk
  tier: ClipTier
  budget: number
  nodeCount: number
  maxTableDepth: number
}

export interface RenderResult {
  html: string
  text: string
  stats: RenderStats
}

export interface RenderOptions {
  theme?: EmailTheme | Palette
  /** Which clip threshold `stats.clipRisk` is judged against. */
  tier?: ClipTier
  /** Keep the output readable. Costs bytes; for debugging and the preview's source view. */
  pretty?: boolean
  /** Supply the plain-text part yourself instead of deriving it. */
  plainText?: string
}

/**
 * Quoted-printable encoded length.
 *
 * Every byte outside the printable ASCII range becomes three characters (`=XX`), and lines
 * are wrapped at 76 characters with a soft break costing one more. Approximating this as
 * "raw length" is what makes a size check lie; approximating it as base64 (+33% flat) would
 * over-report for the mostly-ASCII HTML an email actually contains.
 */
function quotedPrintableLength(html: string): number {
  const bytes = UTF8.encode(html)
  let length = 0
  let column = 0
  for (const byte of bytes) {
    const cost = byte === 0x09 || (byte >= 0x20 && byte <= 0x7e && byte !== 0x3d) ? 1 : 3
    if (column + cost > 75) {
      length += 1 // soft line break
      column = 0
    }
    length += cost
    column += cost
  }
  return length
}

/** Deepest run of nested `<table>` elements — the metric that predicts Outlook layout pain. */
function maxTableDepth(html: string): number {
  let depth = 0
  let max = 0
  for (const m of html.matchAll(/<(\/?)table\b/gi)) {
    if (m[1]) depth -= 1
    else {
      depth += 1
      if (depth > max) max = depth
    }
  }
  return max
}

function countNodes(html: string): number {
  return [...html.matchAll(/<[a-z][^>]*>/gi)].length
}

/**
 * Render an email element to HTML, text, and size accounting.
 *
 * The theme is resolved once here and bound for the whole render — see
 * `runtime/palette.ts` for why a synchronously-scoped binding is the right mechanism and
 * why it is safe.
 */
export function renderEmail(element: ReactElement, options: RenderOptions = {}): RenderResult {
  const { theme = 'light', tier = 'standard', pretty = false, plainText } = options

  const body = withPalette(typeof theme === 'string' ? PALETTES[theme] : theme, () =>
    renderToStaticMarkup(element),
  )

  const html = `${DOCTYPE}${pretty ? '\n' : ''}${pretty ? body : minify(body)}`
  const bytes = UTF8.encode(html).length
  const encodedBytes = quotedPrintableLength(html)
  const budget = CLIP_BUDGETS[tier]

  return {
    html,
    text: plainText ?? toPlainText(html),
    stats: {
      bytes,
      encodedBytes,
      budget,
      tier,
      clipRisk: encodedBytes > budget ? 'over' : encodedBytes > budget * 0.8 ? 'warn' : 'ok',
      nodeCount: countNodes(html),
      maxTableDepth: maxTableDepth(html),
    },
  }
}
