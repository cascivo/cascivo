import { describe, expect, it } from 'vitest'
import { applySuppressions, parseDirectives } from './suppress.js'

interface Finding {
  file: string
  line: number
  rule: string
  level: string
}

const f = (line: number, rule: string, level = 'error'): Finding => ({
  file: 'X.tsx',
  line,
  rule,
  level,
})

describe('parseDirectives', () => {
  it('parses a same-line allow directive with one rule', () => {
    const src = `<Button x /> {/* cascivo-audit: allow unknown-prop */}`
    const { directives, findings } = parseDirectives(src, 'X.tsx')
    expect(findings).toEqual([])
    expect(directives).toHaveLength(1)
    expect(directives[0]?.line).toBe(1)
    expect(directives[0]?.rules).not.toBe('all')
  })

  it('parses multiple comma/space-separated rules', () => {
    const { directives } = parseDirectives(
      `// cascivo-audit: allow unknown-prop, hardcoded-value`,
      'X.tsx',
    )
    const rules = directives[0]?.rules
    expect(rules === 'all' ? [] : [...(rules ?? [])]).toEqual(['unknown-prop', 'hardcoded-value'])
  })

  it('parses allow all', () => {
    const { directives } = parseDirectives(`/* cascivo-audit: allow all */`, 'X.tsx')
    expect(directives[0]?.rules).toBe('all')
  })

  it('warns on an unknown rule id', () => {
    const { directives, findings } = parseDirectives(`// cascivo-audit: allow unkown-prop`, 'X.tsx')
    expect(directives).toEqual([])
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ level: 'warn', rule: 'audit-directive' })
  })
})

describe('applySuppressions', () => {
  const src = [
    `// cascivo-audit: allow unknown-prop`, // line 1 → suppresses line 1 & 2
    `<Button frob />`, // line 2
    `<Card bad /> {/* cascivo-audit: allow unknown-prop */}`, // line 3, inline → line 3 & 4
    ``, // line 4
    ``, // line 5
    `<Alert bad />`, // line 6, not covered by any directive
  ].join('\n')

  it('suppresses a finding on the line following the directive', () => {
    const { directives } = parseDirectives(src, 'X.tsx')
    const out = applySuppressions([f(2, 'unknown-prop')], directives)
    expect(out[0]?.suppressed).toBe(true)
  })

  it('suppresses a finding on the same line as an inline directive', () => {
    const { directives } = parseDirectives(src, 'X.tsx')
    const out = applySuppressions([f(3, 'unknown-prop')], directives)
    expect(out[0]?.suppressed).toBe(true)
  })

  it('does not suppress a finding on an uncovered line', () => {
    const { directives } = parseDirectives(src, 'X.tsx')
    const out = applySuppressions([f(6, 'unknown-prop')], directives)
    expect(out[0]?.suppressed).toBeUndefined()
  })

  it('only suppresses the named rule, not every rule on the line', () => {
    const { directives } = parseDirectives(`// cascivo-audit: allow unknown-prop`, 'X.tsx')
    const out = applySuppressions([f(2, 'unknown-prop'), f(2, 'hardcoded-value')], directives)
    expect(out[0]?.suppressed).toBe(true)
    expect(out[1]?.suppressed).toBeUndefined()
  })

  it('allow all suppresses any rule', () => {
    const { directives } = parseDirectives(`/* cascivo-audit: allow all */`, 'X.tsx')
    const out = applySuppressions([f(2, 'hardcoded-value')], directives)
    expect(out[0]?.suppressed).toBe(true)
  })
})
