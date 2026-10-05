/**
 * Broken, missing and placeholder links — the mistakes a recipient finds before you do.
 *
 * The conformance lint asks whether a client can *render* the email; this asks whether the
 * email *goes anywhere*. A reset mail whose button points at `https://example.com/reset`
 * renders perfectly in every client and is useless in all of them — and the shipped
 * templates default to exactly those URLs, so forgetting one prop sends one.
 *
 * Static by design: it reads the rendered HTML and never touches the network, so it runs in
 * `assertSendable`, in the browser preview and on every keystroke. Whether a well-formed URL
 * actually resolves is a separate, slower question — `cascivo email lint --check-links`.
 */
import { decodeAttribute } from './css-attr.ts'

export type LinkProblem =
  /** `href=""`, or an `<a>` / `<img>` with no URL at all. */
  | 'empty'
  /** `/account` — an email has no page to resolve a relative URL against. */
  | 'relative'
  /** A bare `#` — a link that was never filled in. */
  | 'hash'
  /** `#section` — in-message anchors are ignored or broken in most clients. */
  | 'fragment'
  /** `javascript:`, `data:`, `vbscript:`, `file:` — refused or dangerous in every client. */
  | 'unsafe-scheme'
  /** `{{url}}`, `*|URL|*`… — a merge tag nothing replaced. */
  | 'template-variable'
  /** `example.com`, `*.invalid`: reserved names that can never be a real destination. */
  | 'placeholder-host'
  /** `localhost`, `127.0.0.1`, `*.test`, `*.local` — fine in development, never for a recipient. */
  | 'local-host'
  /** Plain `http:` — works, but some clients warn and every recipient is exposed. */
  | 'insecure'
  /** "Lorem ipsum" left in the body. */
  | 'lorem-ipsum'
  /**
   * The URL answered 4xx/5xx or not at all. Only a network check can know this, so
   * `checkLinks` never reports it; `cascivo email lint --check-links` does.
   */
  | 'unreachable'

export interface LinkFinding {
  /** `blocked` fails `assertSendable`; `caveat` is reported and left to the author. */
  level: 'blocked' | 'caveat'
  problem: LinkProblem
  /** The offending URL as the recipient would get it, or the text for `lorem-ipsum`. */
  value: string
  /** `a`, `img`, or `text`. */
  element: 'a' | 'img' | 'text'
  message: string
}

/**
 * What blocks and what does not.
 *
 * Blocked is reserved for what can never be right in a delivered email. `local-host` is not:
 * a development send to Mailpit legitimately links to localhost, and a gate that refused it
 * would be switched off. `placeholder-host` is, because RFC 2606 reserves those names —
 * nothing real lives there, so a send carrying one is a prop someone forgot.
 */
const LEVEL: Record<LinkProblem, LinkFinding['level']> = {
  empty: 'blocked',
  relative: 'blocked',
  hash: 'blocked',
  'unsafe-scheme': 'blocked',
  'template-variable': 'blocked',
  'placeholder-host': 'blocked',
  fragment: 'caveat',
  'local-host': 'caveat',
  insecure: 'caveat',
  'lorem-ipsum': 'caveat',
  unreachable: 'blocked',
}

const MESSAGE: Record<LinkProblem, string> = {
  empty: 'has no URL',
  relative: 'is relative, and an email has no page to resolve it against',
  hash: 'points at "#" — a link that was never filled in',
  fragment: 'is an in-message anchor, which most clients ignore',
  'unsafe-scheme': 'uses a scheme mail clients refuse',
  'template-variable': 'contains a merge tag that was never replaced',
  'placeholder-host': 'points at a reserved placeholder domain',
  'local-host': 'points at a local development host',
  insecure: 'uses plain http:',
  'lorem-ipsum': 'placeholder text left in the body',
  unreachable: 'did not answer with a success',
}

/**
 * `{{x}}`, `{x}`, `*|X|*`, `[[x]]`, `${x}`, and percent-encoded `{{`.
 *
 * Not `%NAME%`: it cannot be told apart from percent-encoding (`%C3%A9t%C3%A9` is "été").
 */
const TEMPLATE_VARIABLE =
  /\{\{[^}]*\}\}|\{[\w.-]+\}|\*\|[^|]+\|\*|\[\[[^\]]+\]\]|\$\{[^}]*\}|%7B%7B/i

const UNSAFE_SCHEME = /^(?:javascript|vbscript|data|file):/i

function isPlaceholderHost(host: string): boolean {
  return /(?:^|\.)example(?:\.(?:com|net|org))?$/.test(host) || host.endsWith('.invalid')
}

function isLocalHost(host: string): boolean {
  return (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '[::1]' ||
    host.startsWith('127.') ||
    /\.(?:localhost|test|local)$/.test(host)
  )
}

/** The one problem worth reporting for a URL, most severe first. */
function classify(url: string): LinkProblem | null {
  const trimmed = url.trim()
  if (trimmed === '') return 'empty'
  if (trimmed === '#') return 'hash'
  if (TEMPLATE_VARIABLE.test(trimmed)) return 'template-variable'
  // Strip control characters and whitespace the way a browser does before reading the
  // scheme, or `java\tscript:` slips past.
  const compact = [...trimmed].filter((c) => c.charCodeAt(0) > 0x20).join('')
  if (UNSAFE_SCHEME.test(compact)) return 'unsafe-scheme'
  if (trimmed.startsWith('#')) return 'fragment'

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return 'relative'
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
  const host = parsed.hostname.toLowerCase()
  if (isPlaceholderHost(host)) return 'placeholder-host'
  if (isLocalHost(host)) return 'local-host'
  if (parsed.protocol === 'http:') return 'insecure'
  return null
}

function finding(
  problem: LinkProblem,
  value: string,
  element: LinkFinding['element'],
): LinkFinding {
  const subject = element === 'text' ? 'Body text' : `<${element}> "${value}"`
  return {
    level: LEVEL[problem],
    problem,
    value,
    element,
    message: `${subject} ${MESSAGE[problem]}`,
  }
}

/** One link or image URL in a rendered email, decoded. `url` is `null` for an `<img>` with no `src`. */
export interface EmailUrl {
  element: 'a' | 'img'
  url: string | null
}

/**
 * Every `<a href>` and `<img src>` in a rendered email, decoded, in document order.
 *
 * Outlook conditional comments are skipped: their VML buttons mirror the real link's `href`.
 * An `<a>` with no `href` is a named anchor rather than a link, and is left out.
 */
export function linkUrls(html: string): EmailUrl[] {
  const urls: EmailUrl[] = []
  for (const tag of html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<(a|img)\b([^>]*)>/gi)) {
    const element = tag[1]!.toLowerCase() as 'a' | 'img'
    const attribute = element === 'a' ? 'href' : 'src'
    const match = new RegExp(`\\s${attribute}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i').exec(tag[2]!)
    if (match) urls.push({ element, url: decodeAttribute(match[1] ?? match[2] ?? '') })
    else if (element === 'img') urls.push({ element, url: null })
  }
  return urls
}

/**
 * Every link and image URL in a rendered email that is broken, missing or a placeholder.
 *
 * Blocked findings first. One finding per element: a URL that is both a placeholder and
 * `http:` reports the placeholder, since fixing that fixes both.
 */
export function checkLinks(html: string): LinkFinding[] {
  const findings: LinkFinding[] = []
  for (const { element, url } of linkUrls(html)) {
    const problem = url === null ? 'empty' : classify(url)
    if (problem) findings.push(finding(problem, url ?? '', element))
  }

  const text = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ')
  const lorem = /lorem ipsum/i.exec(text)
  if (lorem) findings.push(finding('lorem-ipsum', lorem[0], 'text'))

  return findings.sort((a, b) => (a.level === b.level ? 0 : a.level === 'blocked' ? -1 : 1))
}
