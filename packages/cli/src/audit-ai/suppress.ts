/**
 * Inline suppression directives for `cascivo audit --ai`.
 *
 * A comment `cascivo-audit: allow <rule-id>[, <rule-id>…]` (or `allow all`) on the
 * same line as, or the line immediately preceding, a finding downgrades that
 * finding: it is marked `suppressed` so it no longer counts toward the error/warn
 * exit gate, while still being printed so it stays visible. This is the guaranteed
 * loop-breaker for an AI agent — the one escape hatch that no rule can override.
 */

/** Rule ids a directive may name (the user-facing error/warn rules). */
export const AUDIT_RULES = new Set<string>([
  'unknown-prop',
  'hardcoded-value',
  'missing-prop',
  'raw-string',
  'unlayered-css',
  'vendor-css-import',
])

export interface DirectiveFinding {
  file: string
  line: number
  level: 'warn'
  rule: 'audit-directive'
  message: string
}

interface Directive {
  line: number
  rules: 'all' | Set<string>
}

const DIRECTIVE_RE = /cascivo-audit:\s*allow\s+([^\n]+)/i

/**
 * Scan a source file for suppression directives. Returns the parsed directives
 * plus `warn`-level findings for any unknown rule id (so typos surface rather
 * than silently failing to suppress).
 */
export function parseDirectives(
  source: string,
  file: string,
): { directives: Directive[]; findings: DirectiveFinding[] } {
  const directives: Directive[] = []
  const findings: DirectiveFinding[] = []
  const lines = source.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i]?.match(DIRECTIVE_RE)
    if (!m || m[1] === undefined) continue
    // Strip trailing comment terminators (`*/`, `-->`) and whitespace.
    const raw = m[1]
      .replace(/\*\/.*$/, '')
      .replace(/-->.*$/, '')
      .trim()
    const ids = raw.split(/[\s,]+/).filter(Boolean)
    const line = i + 1
    if (ids.includes('all')) {
      directives.push({ line, rules: 'all' })
      continue
    }
    const valid = new Set<string>()
    const unknown: string[] = []
    for (const id of ids) {
      if (AUDIT_RULES.has(id)) valid.add(id)
      else unknown.push(id)
    }
    if (valid.size > 0) directives.push({ line, rules: valid })
    if (unknown.length > 0) {
      findings.push({
        file,
        line,
        level: 'warn',
        rule: 'audit-directive',
        message:
          `unknown audit rule id${unknown.length > 1 ? 's' : ''} in directive: ${unknown.join(', ')}. ` +
          `valid ids: ${[...AUDIT_RULES].join(', ')}.`,
      })
    }
  }
  return { directives, findings }
}

/**
 * Mark findings covered by a directive as `suppressed`. A directive on line L
 * applies to findings on line L (inline comment) or line L+1 (comment above the
 * code). Level is left unchanged; callers exclude `suppressed` findings from the
 * exit gate.
 */
export function applySuppressions<T extends { line: number; rule: string }>(
  findings: T[],
  directives: Directive[],
): Array<T & { suppressed?: boolean }> {
  if (directives.length === 0) return findings
  return findings.map((f) => {
    const covered = directives.some(
      (d) =>
        (d.line === f.line || d.line === f.line - 1) && (d.rules === 'all' || d.rules.has(f.rule)),
    )
    return covered ? { ...f, suppressed: true } : f
  })
}
