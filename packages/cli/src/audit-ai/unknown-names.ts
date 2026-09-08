import type { Contract } from '../utils/contract-pure.js'

export interface UnknownNameFinding {
  file: string
  line: number
  /** The name as written. */
  name: string
  level: 'error'
  rule: 'unknown-token' | 'unknown-style-hook'
  /** The closest shipped name, when one is close enough to be worth naming. */
  suggestion?: string
}

/**
 * A `--cascivo-*` custom property or a `data-cascivo-*` selector that does not exist.
 *
 * ## Why this is the audit's most valuable rule
 *
 * Every other rule here reports something the adopter could in principle have found: a
 * hardcoded colour is visible, an unknown prop is a type error, unlayered CSS shows up in
 * DevTools. These two are the only findings that are **completely silent everywhere else in
 * the stack**:
 *
 *   - CSS drops an unknown custom property. `--cascivo-color-acent: red` does not warn, does
 *     not fail the build, does not appear in DevTools, and does not throw. It has no effect,
 *     and the search for the cause starts in the component.
 *   - A selector that matches nothing is not an error either. `[data-cascivo-modl-body]`
 *     styles zero elements forever. Because CSS Modules hash the real class names, the
 *     adopter has no way to tell a typo from a component that simply changed shape.
 *
 * The day this rule was written it found `--cascivo-button-bg` — a token taught as *the*
 * worked example of the override ladder's first rung in four separate guides, and defined by
 * no stylesheet in the repo. It had been wrong long enough to be copied into `CLAUDE.md`.
 *
 * ## Why `error`, not `warn`
 *
 * `hardcoded-value` is an error when exactly one token matches, and this is strictly more
 * certain than that: there is no reading under which a name that does not exist is doing
 * something. The lint rule (`cascivo/token-values`) reports the same class at `warn`, because
 * that one appears unasked in an editor; the audit is a gate somebody chose to run.
 */
const HOOK_PATTERN = /\[\s*(data-cascivo-[a-z0-9-]+)/g
const TOKEN_PATTERN = /(--cascivo-[a-z0-9-]+)/g

/** Levenshtein distance — only reached for names already known to be wrong. */
function distance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j]! + 1,
        current[j - 1]! + 1,
        previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
    previous = current
  }
  return previous[b.length]!
}

/**
 * The closest shipped name, or undefined when nothing is close enough.
 *
 * Segments-in-the-wrong-order is checked first and separately: `--cascivo-text-color` for
 * `--cascivo-color-text` is the trap `docs/TOKENS.md` documents, it is what anyone typing
 * from memory produces, and it is four edits away — far beyond any threshold that stays
 * quiet on names the adopter invented deliberately.
 */
function nearest(name: string, candidates: Set<string>): string | undefined {
  const key = (n: string) => n.split('-').filter(Boolean).sort().join('-')
  const wanted = key(name)
  for (const candidate of candidates) {
    if (key(candidate) === wanted) return candidate
  }
  const budget = Math.min(4, Math.max(2, Math.floor(name.length / 8)))
  let best: string | undefined
  let bestDistance = Number.POSITIVE_INFINITY
  for (const candidate of candidates) {
    const d = distance(name, candidate)
    if (d < bestDistance) {
      bestDistance = d
      best = candidate
    }
  }
  return bestDistance <= budget ? best : undefined
}

/** Character offset → 1-based line number. */
function lineAt(source: string, index: number): number {
  let line = 1
  for (let i = 0; i < index; i++) if (source[i] === '\n') line++
  return line
}

export function findUnknownNameViolations(
  source: string,
  filename: string,
  contract: Contract,
): UnknownNameFinding[] {
  const findings: UnknownNameFinding[] = []

  // An older contract carries neither set. Reporting every name as unknown because the
  // contract is thin would be catastrophic, so an empty set means "cannot check".
  if (contract.tokenNames.size > 0) {
    for (const match of source.matchAll(TOKEN_PATTERN)) {
      const name = match[1]!
      if (contract.tokenNames.has(name)) continue
      const suggestion = nearest(name, contract.tokenNames)
      findings.push({
        file: filename,
        line: lineAt(source, match.index),
        name,
        level: 'error',
        rule: 'unknown-token',
        ...(suggestion ? { suggestion } : {}),
      })
    }
  }

  if (contract.styleHooks.size > 0) {
    for (const match of source.matchAll(HOOK_PATTERN)) {
      const name = match[1]!
      if (contract.styleHooks.has(name)) continue
      const suggestion = nearest(name, contract.styleHooks)
      findings.push({
        file: filename,
        line: lineAt(source, match.index),
        name,
        level: 'error',
        rule: 'unknown-style-hook',
        ...(suggestion ? { suggestion } : {}),
      })
    }
  }

  return findings
}
