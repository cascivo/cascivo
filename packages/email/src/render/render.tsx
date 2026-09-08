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
import { extractPreheader, toPlainText, type PlainTextOptions } from './plaintext.ts'
import { quotedPrintable, type EmailMessage } from './message.ts'
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

export interface RenderResult extends EmailMessage {
  stats: RenderStats
}

export interface RenderOptions {
  theme?: EmailTheme | Palette
  /**
   * The subject line.
   *
   * Part of the render rather than the send because it belongs to the template: the subject,
   * the `<title>` and the preheader are three facets of the same message, and splitting them
   * across two call sites is how they drift apart. Defaults to the empty string, which
   * `assertSendable` rejects.
   */
  subject?: string
  /** Which clip threshold `stats.clipRisk` is judged against. */
  tier?: ClipTier
  /** Keep the output readable. Costs bytes; for debugging and the preview's source view. */
  pretty?: boolean
  /** Supply the plain-text part yourself instead of deriving it. */
  plainText?: string
  /** How the plain-text alternative is derived, when it is not supplied. */
  text?: PlainTextOptions
}

/**
 * Quoted-printable encoded length — by encoding, not by estimating.
 *
 * This was briefly a second, hand-rolled cost model that agreed with the real encoder to
 * within 3%. Two implementations of one number is one too many: a budget that is checked
 * against an estimate and delivered against an encoder is not a budget. `message.ts` owns
 * the encoding; this measures its output.
 */
function quotedPrintableLength(html: string): number {
  // QP output is ASCII by construction, so character length is byte length.
  return quotedPrintable(html).length
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
  const {
    theme = 'light',
    tier = 'standard',
    pretty = false,
    plainText,
    subject = '',
    text,
  } = options

  const body = withPalette(typeof theme === 'string' ? PALETTES[theme] : theme, () =>
    renderToStaticMarkup(element),
  )

  const html = `${DOCTYPE}${pretty ? '\n' : ''}${pretty ? body : minify(body)}`
  const bytes = UTF8.encode(html).length
  const encodedBytes = quotedPrintableLength(html)
  const budget = CLIP_BUDGETS[tier]

  return {
    html,
    subject,
    text: plainText ?? toPlainText(html, text),
    preheader: extractPreheader(html),
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

/**
 * Throw unless the message is actually sendable.
 *
 * Four things go wrong often enough to be worth a gate, and all four are invisible until
 * someone opens the mail: no subject, no text alternative, no preheader (the client then
 * shows the opening words of the body), and a body over the clip threshold.
 *
 * Deliberately a separate call rather than something `renderEmail` does. A preview renders
 * a half-finished template on every keystroke and must not throw; a send path wants to fail
 * loudly. Making that the caller's choice keeps both honest.
 */
export function assertSendable(result: RenderResult): void {
  const problems: string[] = []
  if (!result.subject.trim()) problems.push('no subject')
  if (!result.text.trim()) problems.push('no plain-text alternative')
  if (!result.preheader) {
    problems.push('no preheader — add <Preview>, or the client shows the first words of the body')
  }
  if (result.stats.clipRisk === 'over') {
    problems.push(
      `${result.stats.encodedBytes} encoded bytes exceeds the ${result.stats.tier} clip threshold of ${result.stats.budget}`,
    )
  }
  if (problems.length > 0) {
    throw new Error(`Email is not sendable: ${problems.join('; ')}`)
  }
}
