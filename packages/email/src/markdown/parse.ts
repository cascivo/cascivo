/**
 * A deliberately small Markdown parser.
 *
 * ## Why this exists at all
 *
 * The migration map's answer to React Email's `Markdown` was "compose the primitives
 * instead", and for a transactional template that is right — the copy is known at build
 * time. It is not an answer for a newsletter, whose prose is written by an editor and
 * fetched at send time: there is nothing to compose. The reported workaround was keeping
 * `@react-email/components` installed for `Markdown` alone, which leaves that subtree
 * unthemed and unlinted and removes most of the reason to migrate.
 *
 * ## Why a parser rather than a markdown library
 *
 * The objection to rendering Markdown was never the syntax, it was the output: arbitrary
 * Markdown produces arbitrary HTML, and the conformance lint cannot vouch for HTML it has
 * no primitive for. This parser answers that by never producing HTML. It produces a small
 * typed tree whose every node has a cascivo primitive to render it, so the lint sees the
 * same element and property set it would have seen from a hand-composed template.
 *
 * That is also why raw HTML in the source is not a special case: `<b>x</b>` parses as text
 * and renders as the four visible characters `<b>x`, because React escapes what it is
 * given. There is no path from source to markup.
 *
 * ## What it is not
 *
 * Not CommonMark. The supported set is the one a newsletter actually uses — see
 * `components/markdown.tsx` for the published list — and anything outside it degrades to
 * the literal text rather than throwing, because prose fetched at send time must never be
 * able to fail a send.
 */

/** Inline nodes. Each has exactly one primitive that renders it. */
export type Inline =
  | { kind: 'text'; value: string }
  | { kind: 'strong'; children: Inline[] }
  | { kind: 'em'; children: Inline[] }
  | { kind: 'code'; value: string }
  | { kind: 'link'; href: string; children: Inline[] }
  | { kind: 'image'; src: string; alt: string }

/** Block nodes. */
export type Block =
  | { kind: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: Inline[] }
  | { kind: 'paragraph'; children: Inline[] }
  | { kind: 'list'; ordered: boolean; items: Inline[][] }
  | { kind: 'code'; value: string }
  | { kind: 'quote'; children: Block[] }
  | { kind: 'hr' }

/**
 * Accept only URLs an email client will act on.
 *
 * An **allowlist of schemes**, never a denylist. A denylist is defeated by anything that
 * normalises to the same scheme later — `JaVaScRiPt:`, an embedded tab, a percent-encoded
 * colon — and a URL here comes from a CMS payload, which is precisely the untrusted input
 * the repo's "never `as` a payload you did not produce" rule is about.
 *
 * Relative URLs are rejected as well, and not on security grounds: an email has no base
 * document, so `/pricing` resolves against the *client's* host and 404s. A link that cannot
 * work is better shown as its own label than as a broken anchor.
 */
export function safeUrl(raw: string): string | undefined {
  const url = raw.trim()
  return /^(?:https?:|mailto:)[^\s]/i.test(url) ? url : undefined
}

/** Punctuation a backslash may escape. */
const ESCAPABLE = new Set('\\`*_{}[]()#+-.!>|~')

const AUTOLINK = /^<((?:https?:\/\/|mailto:)[^\s<>]+)>/i
const CODE_SPAN = /^(`+)([^`]|[\s\S]*?[^`])\1(?!`)/

interface LinkMatch {
  label: string
  dest: string
  /** Index just past the closing `)`. */
  end: number
}

/**
 * Match `[label](dest "title")` starting at the `[`.
 *
 * A scanner rather than a regular expression because both halves nest. A destination may
 * carry balanced parentheses — `…/wiki/Ruby_(programming_language)` is an ordinary link in
 * a newsletter — and a regex that stops at the first `)` truncates it into something
 * `safeUrl` then rejects, silently turning a working link into plain text.
 */
function matchLink(source: string, offset: number): LinkMatch | undefined {
  let i = offset + 1
  let depth = 1
  for (; i < source.length && depth > 0; i += 1) {
    const c = source[i]
    if (c === '\\') i += 1
    else if (c === '[') depth += 1
    else if (c === ']') depth -= 1
  }
  if (depth !== 0 || source[i] !== '(') return undefined

  const label = source.slice(offset + 1, i - 1)
  const destStart = i + 1
  i = destStart
  let paren = 1
  for (; i < source.length && paren > 0; i += 1) {
    const c = source[i]
    if (c === '\\') i += 1
    else if (c === '(') paren += 1
    else if (c === ')') paren -= 1
  }
  if (paren !== 0) return undefined

  // The destination runs to the first whitespace; anything after it is the optional title,
  // which no email client shows and this does not carry.
  const inner = source.slice(destStart, i - 1).trim()
  return { label, dest: inner.split(/\s/, 1)[0] ?? '', end: i }
}

/** `_` must not split a word — `snake_case_name` is an identifier, not emphasis. */
function isWordChar(c: string | undefined): boolean {
  return c !== undefined && /[\w]/.test(c)
}

/**
 * Tokenize one run of inline content.
 *
 * Longest-marker-first: `**` is tested before `*`, and an image before a link, so the
 * shorter form can never swallow the opening of the longer one.
 *
 * The two `^`-anchored patterns take a tail slice, and only inside the branch whose opening
 * character has already matched. Slicing once per character instead would make the whole
 * function quadratic in the length of the source — which for this component is a Markdown
 * blob of unbounded size fetched from somebody's CMS.
 */
export function parseInline(source: string): Inline[] {
  const out: Inline[] = []
  let text = ''
  let i = 0

  const flush = () => {
    if (text) out.push({ kind: 'text', value: text })
    text = ''
  }

  while (i < source.length) {
    const c = source[i]!

    if (c === '\\' && ESCAPABLE.has(source[i + 1] ?? '')) {
      text += source[i + 1]
      i += 2
      continue
    }

    if (c === '`') {
      const m = CODE_SPAN.exec(source.slice(i))
      if (m) {
        flush()
        out.push({ kind: 'code', value: m[2]!.trim() })
        i += m[0].length
        continue
      }
    }

    if (c === '!' && source[i + 1] === '[') {
      const m = matchLink(source, i + 1)
      if (m) {
        const src = safeUrl(m.dest)
        flush()
        // An unusable src keeps the alt text: the words the editor wrote are the content,
        // and dropping them would lose more than the picture did.
        if (src) out.push({ kind: 'image', src, alt: m.label })
        else text += m.label
        i = m.end
        continue
      }
    }

    if (c === '[') {
      const m = matchLink(source, i)
      if (m) {
        const href = safeUrl(m.dest)
        flush()
        const children = parseInline(m.label)
        if (href) out.push({ kind: 'link', href, children })
        else out.push(...children)
        i = m.end
        continue
      }
    }

    if (c === '<') {
      const m = AUTOLINK.exec(source.slice(i))
      if (m) {
        flush()
        out.push({ kind: 'link', href: m[1]!, children: [{ kind: 'text', value: m[1]! }] })
        i += m[0].length
        continue
      }
    }

    if (c === '*' || c === '_') {
      const intraword = c === '_' && isWordChar(source[i - 1])
      if (!intraword) {
        const double = source[i + 1] === c
        const marker = double ? c + c : c
        const closing = source.indexOf(marker, i + marker.length)
        const after = source[closing + marker.length]
        const usable = closing > i + marker.length && !(c === '_' && !double && isWordChar(after))
        if (usable) {
          flush()
          const children = parseInline(source.slice(i + marker.length, closing))
          out.push({ kind: double ? 'strong' : 'em', children })
          i = closing + marker.length
          continue
        }
      }
    }

    text += c
    i += 1
  }

  flush()
  return out
}

const HEADING = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/
const FENCE = /^\s*(`{3,}|~{3,})/
const BREAK = /^ {0,3}([-*_])[ \t]*(?:\1[ \t]*){2,}$/
const QUOTE = /^ {0,3}>/
const BULLET = /^ {0,3}(?:[-*+]|\d{1,9}[.)])[ \t]+/

/** Does this line start a block other than a paragraph? Stops paragraph accumulation. */
function startsBlock(line: string): boolean {
  return (
    HEADING.test(line) ||
    FENCE.test(line) ||
    BREAK.test(line) ||
    QUOTE.test(line) ||
    BULLET.test(line)
  )
}

/** Parse a Markdown document into the supported block set. */
export function parseMarkdown(source: string): Block[] {
  const lines = source.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]!

    if (!line.trim()) {
      i += 1
      continue
    }

    const fence = FENCE.exec(line)
    if (fence) {
      const marker = fence[1]!
      const closing = new RegExp(`^\\s*${marker[0] === '`' ? '`' : '~'}{${marker.length},}\\s*$`)
      const body: string[] = []
      i += 1
      while (i < lines.length && !closing.test(lines[i]!)) {
        body.push(lines[i]!)
        i += 1
      }
      // An unterminated fence ends at EOF rather than throwing — see the file header on why
      // malformed prose must never fail a send.
      i += 1
      blocks.push({ kind: 'code', value: body.join('\n') })
      continue
    }

    const heading = HEADING.exec(line)
    if (heading) {
      blocks.push({
        kind: 'heading',
        level: heading[1]!.length as 1,
        children: parseInline(heading[2]!),
      })
      i += 1
      continue
    }

    if (BREAK.test(line)) {
      blocks.push({ kind: 'hr' })
      i += 1
      continue
    }

    if (QUOTE.test(line)) {
      const body: string[] = []
      while (i < lines.length && QUOTE.test(lines[i]!)) {
        body.push(lines[i]!.replace(/^ {0,3}>[ \t]?/, ''))
        i += 1
      }
      blocks.push({ kind: 'quote', children: parseMarkdown(body.join('\n')) })
      continue
    }

    if (BULLET.test(line)) {
      const ordered = /^ {0,3}\d/.test(line)
      const items: string[] = []
      while (i < lines.length && BULLET.test(lines[i]!)) {
        let item = lines[i]!.replace(BULLET, '')
        i += 1
        // A wrapped item continues on the next line; a blank line or a new block ends it.
        while (i < lines.length && lines[i]!.trim() && !startsBlock(lines[i]!)) {
          item += ` ${lines[i]!.trim()}`
          i += 1
        }
        items.push(item)
      }
      blocks.push({ kind: 'list', ordered, items: items.map(parseInline) })
      continue
    }

    const paragraph: string[] = []
    while (i < lines.length && lines[i]!.trim() && !startsBlock(lines[i]!)) {
      paragraph.push(lines[i]!.trim())
      i += 1
    }
    blocks.push({ kind: 'paragraph', children: parseInline(paragraph.join(' ')) })
  }

  return blocks
}
