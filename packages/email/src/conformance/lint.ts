/**
 * Layer 1 of the test strategy: check rendered email HTML against the Can I email matrix.
 *
 * Walks the output, pulls out every CSS declaration, HTML element and at-rule, and asks
 * `verdict()` about each. Nothing here knows what a component is — it reads the finished
 * document, which is the only thing an email client sees.
 *
 * Deliberately a scanner, not a parser. The input is our own generator's output: inline
 * styles in `style="…"` attributes and a small set of tags. A full CSS/HTML parser would be
 * a dependency this package does not have and would not find anything more.
 */
import { atRuleSlug, elementSlug, propertySlug, valueSlugs } from './slugs.ts'
import { DEFAULT_FLOOR, verdict, type ClientRef, type Feature, type Level } from './support.ts'

export interface Finding {
  level: Level
  slug: string
  /** What in the document produced this — a declaration, tag name, or at-rule. */
  source: string
  /** Floor clients that do not fully support it. */
  clients: string[]
}

export interface LintOptions {
  floor?: readonly ClientRef[]
  /**
   * Slugs allowed to be `blocked` without failing.
   *
   * Every entry needs a written reason. The list exists for genuine progressive
   * enhancement — a declaration whose absence degrades rather than breaks — and it is the
   * escape hatch that keeps the lint honest: without it, one legitimate exception would
   * push a project to disable the whole check.
   */
  allow?: Readonly<Record<string, string>>
}

/**
 * Blocked slugs the cascivo primitives accept, each with its reason.
 *
 * The bar for an entry is that **absence degrades rather than breaks**: the email is still
 * correct, legible and actionable in the client that lacks the feature. Anything that would
 * lose content, break layout, or make an action unreachable is not eligible and must be
 * solved in the markup instead.
 *
 * This is the whole allowlist. It is deliberately short, and it is exported so the check
 * script, the tests and the preview panel all consult the same list rather than each
 * carrying its own idea of what is acceptable.
 */
export const CASCIVO_ALLOW: Readonly<Record<string, string>> = {
  'css-border-radius':
    'Outlook Windows and Yahoo render square corners. Buttons, cards and badges stay ' +
    'fully legible and clickable — only the corner shape is lost. The alternative is a ' +
    'VML `v:roundrect` per button: ~400 bytes each, unable to inherit the anchor styles, ' +
    'and a second implementation of every button to keep in sync. Square corners in two ' +
    'clients is the better trade.',
}

/** Declarations found in `style="…"` attributes, plus any `<style>` block. */
function declarations(html: string): { property: string; value: string }[] {
  const out: { property: string; value: string }[] = []

  for (const m of html.matchAll(/\sstyle="([^"]*)"/gi)) {
    for (const decl of m[1]!.split(';')) {
      const at = decl.indexOf(':')
      if (at === -1) continue
      out.push({ property: decl.slice(0, at).trim(), value: decl.slice(at + 1).trim() })
    }
  }

  for (const block of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    for (const decl of block[1]!.matchAll(/([a-z-]+)\s*:\s*([^;{}]+)[;}]/gi)) {
      out.push({ property: decl[1]!.trim(), value: decl[2]!.trim() })
    }
  }

  return out
}

function elements(html: string): string[] {
  return [...new Set([...html.matchAll(/<([a-z][\w-]*)\b/gi)].map((m) => m[1]!.toLowerCase()))]
}

function atRules(html: string): { rule: string; prelude: string }[] {
  return [...html.matchAll(/@([a-z-]+)([^{]*)\{/gi)].map((m) => ({
    rule: m[1]!,
    prelude: m[2]!.trim(),
  }))
}

/**
 * Lint a rendered email.
 *
 * Returns every finding, `blocked` first. Callers decide what is fatal — the check script
 * fails on `blocked`, the preview panel shows all three levels — because a caveat is
 * information an author wants and not a reason to stop the build.
 */
export function lint(
  html: string,
  features: Map<string, Feature>,
  options: LintOptions = {},
): Finding[] {
  const { floor = DEFAULT_FLOOR, allow = {} } = options
  const findings = new Map<string, Finding>()

  const record = (slug: string, source: string) => {
    if (slug in allow) return
    const v = verdict(features, slug, floor)
    // `untested` is silent: foundational HTML like <td> and <a> is simply absent from the
    // matrix, and reporting it would bury the real findings in noise.
    if (v.level === 'ok' || v.level === 'untested') return
    const key = `${slug}|${source}`
    if (findings.has(key)) return
    findings.set(key, {
      level: v.level,
      slug,
      source,
      clients: v.findings.map((f) => f.client.label),
    })
  }

  for (const { property, value } of declarations(html)) {
    record(propertySlug(property), `${property}: ${value}`)
    for (const slug of valueSlugs(property, value)) record(slug, `${property}: ${value}`)
  }

  // Conditional comments are Outlook-only by construction; the markup inside them is not
  // subject to the floor, so they are removed before the element sweep.
  const withoutConditionals = html.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '')
  for (const tag of elements(withoutConditionals)) record(elementSlug(tag), `<${tag}>`)

  for (const { rule, prelude } of atRules(html))
    record(atRuleSlug(rule, prelude), `@${rule} ${prelude}`.trim())

  const order: Record<Level, number> = { blocked: 0, caveat: 1, untested: 2, ok: 3 }
  return [...findings.values()].sort(
    (a, b) => order[a.level] - order[b.level] || a.slug.localeCompare(b.slug),
  )
}
