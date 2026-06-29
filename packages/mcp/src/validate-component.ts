/**
 * Shadow-sandbox component validator.
 *
 * Runs cascivo's own structural invariants over a candidate component's source
 * (TSX + CSS) *before* it is written to disk, so an agent can loop until the
 * source passes instead of emitting code that the repo's gates would later
 * reject. This is a static structural evaluation — not a full browser render —
 * but it catches the mistakes LLMs actually make against this design system:
 * banned React hooks, off-scale breakpoint literals, missing static fallbacks
 * for progressive CSS, and hallucinated `--cascivo-*` tokens.
 *
 * The checks mirror the repo gates:
 *   - use-signals-gate / authoring rules  → banned hooks
 *   - breakpoint:check                     → off-scale @media/@container widths
 *   - fallback:check                       → @function/if() static-fallback contract
 *   - token catalog (closed set)           → no hallucinated tokens
 */

export type Severity = 'error' | 'warning'

export interface ComponentViolation {
  rule: string
  severity: Severity
  line: number
  detail: string
}

export interface ValidateComponentInput {
  /** Component TSX source. */
  tsx?: string
  /** Component CSS (module or plain) source. */
  css?: string
  /** Component name, for messages only. */
  name?: string
}

export interface ValidateComponentOptions {
  /**
   * The closed set of valid `--cascivo-*` token names. When provided, any
   * `var(--cascivo-…)` reference outside this set is flagged as hallucinated.
   */
  tokenNames?: ReadonlySet<string>
  /**
   * Map of alias token → canonical token. When provided, any `var(--cascivo-…)`
   * reference using an alias is flagged (warning) to steer toward the canonical
   * name — "exactly one correct token" per purpose.
   */
  aliasMap?: ReadonlyMap<string, string>
}

export interface ValidateComponentResult {
  valid: boolean
  name?: string
  violations: ComponentViolation[]
}

// Hooks that cascivo components must never use — signals replace them.
const BANNED_HOOKS = ['useState', 'useEffect', 'useLayoutEffect', 'useContext', 'useReducer']

// Canonical breakpoint width literals (the only ones allowed in @media/@container).
const CANONICAL_WIDTHS = new Set([
  '30rem',
  '40rem',
  '64rem',
  '80rem',
  '480px',
  '640px',
  '1024px',
  '1280px',
])

function lineOf(source: string, index: number): number {
  let line = 1
  for (let i = 0; i < index && i < source.length; i++) {
    if (source[i] === '\n') line++
  }
  return line
}

/** Detect banned React hooks in TSX (usage or import). */
function checkBannedHooks(tsx: string): ComponentViolation[] {
  const violations: ComponentViolation[] = []
  for (const hook of BANNED_HOOKS) {
    const re = new RegExp(`\\b${hook}\\b`, 'g')
    let m: RegExpExecArray | null
    while ((m = re.exec(tsx)) !== null) {
      violations.push({
        rule: 'banned-hook',
        severity: 'error',
        line: lineOf(tsx, m.index),
        detail:
          hook === 'useEffect'
            ? `${hook} is banned — use useSignalEffect for DOM side effects`
            : `${hook} is banned — use useSignal/useComputed from @cascivo/core`,
      })
    }
  }
  return violations
}

/** Detect off-scale width literals in @media / @container conditions. */
function checkBreakpoints(css: string): ComponentViolation[] {
  const violations: ComponentViolation[] = []
  const widthCondRe =
    /(?:min-width|max-width|width|min-inline-size|max-inline-size|inline-size)\s*:\s*([\d.]+(?:rem|px|em))/g
  const lines = css.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const trimmed = (lines[i] ?? '').trim()
    if (!trimmed.startsWith('@media') && !trimmed.startsWith('@container')) continue
    if (
      /prefers|forced|pointer|hover|aspect|color|resolution|orientation|print|screen/.test(trimmed)
    )
      continue
    let m: RegExpExecArray | null
    widthCondRe.lastIndex = 0
    while ((m = widthCondRe.exec(trimmed)) !== null) {
      const value = m[1] ?? ''
      if (!CANONICAL_WIDTHS.has(value)) {
        violations.push({
          rule: 'off-scale-breakpoint',
          severity: 'error',
          line: i + 1,
          detail: `Off-scale width "${value}" — use 30rem/40rem/64rem/80rem`,
        })
      }
    }
  }
  return violations
}

const isFunctionCall = (value: string) => /--[\w-]+\(/.test(value)
const isIfExpression = (value: string) => /\bif\s*\(/.test(value)

/** Enforce the @function / if() static-fallback contract. */
function checkFallbacks(css: string): ComponentViolation[] {
  const violations: ComponentViolation[] = []
  const lines = css.split('\n')
  let inSupports = false
  let supportsDepth = 0
  let baseSupportsDepth = 0
  interface Block {
    properties: Map<string, boolean>
  }
  const stack: Block[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] ?? '').trim()
    if (/^@supports\b/.test(line)) {
      inSupports = true
      baseSupportsDepth = supportsDepth
    }
    const opens = (line.match(/\{/g) ?? []).length
    const closes = (line.match(/\}/g) ?? []).length
    for (let j = 0; j < opens; j++) {
      stack.push({ properties: new Map() })
      supportsDepth++
    }
    for (let j = 0; j < closes; j++) {
      if (stack.length > 0) stack.pop()
      supportsDepth--
      if (supportsDepth <= baseSupportsDepth) inSupports = false
    }
    const declMatch = line.match(/^([\w-]+)\s*:\s*(.+?)\s*;?\s*$/)
    if (!declMatch) continue
    const property = declMatch[1]!
    const value = declMatch[2]!
    if (isFunctionCall(value) || isIfExpression(value)) {
      let hasFallback = inSupports
      if (!hasFallback) {
        for (const block of stack) {
          if (block.properties.get(property)) {
            hasFallback = true
            break
          }
        }
      }
      if (!hasFallback) {
        violations.push({
          rule: 'missing-css-fallback',
          severity: 'error',
          line: i + 1,
          detail: `"${property}" uses @function/if() with no preceding static fallback`,
        })
      }
    } else if (stack.length > 0) {
      stack[stack.length - 1]!.properties.set(property, true)
    }
  }
  return violations
}

/** Flag `var(--cascivo-…)` references that are not in the closed token set. */
function checkTokens(css: string, tokenNames: ReadonlySet<string>): ComponentViolation[] {
  if (tokenNames.size === 0) return []
  const violations: ComponentViolation[] = []
  const re = /var\(\s*(--cascivo-[\w-]+)/g
  let m: RegExpExecArray | null
  const seen = new Set<string>()
  while ((m = re.exec(css)) !== null) {
    const token = m[1]!
    if (tokenNames.has(token) || seen.has(token)) continue
    seen.add(token)
    violations.push({
      rule: 'unknown-token',
      severity: 'error',
      line: lineOf(css, m.index),
      detail: `"${token}" is not in the cascivo token catalog (hallucinated token)`,
    })
  }
  return violations
}

/** Flag `var(--cascivo-…)` references that use an alias where a canonical token exists. */
function checkAliasTokens(
  css: string,
  aliasMap: ReadonlyMap<string, string>,
): ComponentViolation[] {
  if (aliasMap.size === 0) return []
  const violations: ComponentViolation[] = []
  const re = /var\(\s*(--cascivo-[\w-]+)/g
  let m: RegExpExecArray | null
  const seen = new Set<string>()
  while ((m = re.exec(css)) !== null) {
    const token = m[1]!
    const canonical = aliasMap.get(token)
    if (!canonical || seen.has(token)) continue
    seen.add(token)
    violations.push({
      rule: 'alias-token-used',
      severity: 'warning',
      line: lineOf(css, m.index),
      detail: `"${token}" is an alias — prefer the canonical "${canonical}"`,
    })
  }
  return violations
}

/** Run all structural invariants over a candidate component's source. */
export function validateComponentSource(
  input: ValidateComponentInput,
  options: ValidateComponentOptions = {},
): ValidateComponentResult {
  const violations: ComponentViolation[] = []
  if (input.tsx) violations.push(...checkBannedHooks(input.tsx))
  if (input.css) {
    violations.push(...checkBreakpoints(input.css))
    violations.push(...checkFallbacks(input.css))
    if (options.tokenNames) violations.push(...checkTokens(input.css, options.tokenNames))
    if (options.aliasMap) violations.push(...checkAliasTokens(input.css, options.aliasMap))
  }
  violations.sort((a, b) => a.line - b.line)
  return {
    valid: violations.every((v) => v.severity !== 'error'),
    ...(input.name ? { name: input.name } : {}),
    violations,
  }
}
