/**
 * Machine mode's knobs. Three, deliberately.
 *
 * Every one of them exists because the email package's plain-text renderer proved it does:
 * an agent that cannot tell a button from a heading is the failure this package exists to
 * fix (`annotate`), and inline URLs shred prose while stripped ones lose the destination
 * (`links`). `width` is off by default here, unlike in email, because wrapping a Markdown
 * table breaks it.
 */
export interface TextOptions {
  /**
   * Name the affordances: `[button: Save]`, `[input: Email = "ada@example.com"]`,
   * `[tab: Overview (selected)]`. Default `true` — an agent reading a UI needs to know what
   * is actionable and what state it is in. Set `false` for a pure reading document.
   */
  annotate?: boolean
  /**
   * How a link's destination survives.
   *
   * - `'inline'` (default) — `[label](href)`, standard Markdown.
   * - `'footnote'` — `label [1]` with a numbered list at the end, for link-dense prose.
   * - `'strip'` — label only, for a UI whose links are all tracking URLs.
   */
  links?: 'inline' | 'footnote' | 'strip'
  /**
   * Wrap column for plain paragraphs, or `0` (default) for no wrapping. Tables, fenced code
   * and lists are never wrapped — wrapping them changes what they mean.
   */
  width?: number
}

export interface ResolvedOptions {
  annotate: boolean
  links: 'inline' | 'footnote' | 'strip'
  width: number
}

export function resolveOptions(options: TextOptions | undefined): ResolvedOptions {
  return {
    annotate: options?.annotate ?? true,
    links: options?.links ?? 'inline',
    width: options?.width ?? 0,
  }
}
