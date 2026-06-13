import { describe, expect, it } from 'vitest'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { buildContract } from '../utils/contract.js'
import { findCssLiteralViolations } from './css-literals.js'
import { findJsxPropViolations } from './jsx-props.js'
import { findRequiredPropViolations } from './required-props.js'
import { fixCssLiterals } from '../commands/audit.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const FIXTURES = join(HERE, '__fixtures__')

/**
 * Minimal contract that covers the values and components used in the fixtures.
 *
 * Dirty fixtures use:
 *   - oklch(0.373 0.015 264) → --cascivo-gray-700
 *   - oklch(0.623 0.214 250) → --cascivo-color-accent
 *   - <Button frobnicate>           → unknown prop
 *   - <Tooltip> (no required prop)  → no required-prop finding (Tooltip has none)
 *
 * For the --fix test we use a hex-based CSS string, because fixCssLiterals
 * only rewrites hex literals (oklch is left for manual review).
 */
const contract = buildContract({
  catalog: {
    tokens: [
      { name: '--cascivo-gray-700', resolvedDefault: 'oklch(0.373 0.015 264)' },
      { name: '--cascivo-color-accent', resolvedDefault: 'oklch(0.623 0.214 250)' },
      { name: '--cascivo-color-primary', resolvedDefault: '#3b82f6' },
    ],
  },
  registry: {
    components: [
      {
        meta: {
          name: 'Button',
          props: [
            { name: 'variant', type: 'string', required: false },
            { name: 'size', type: 'string', required: false },
            { name: 'loading', type: 'boolean', required: false },
          ],
        },
      },
      {
        meta: {
          name: 'Tooltip',
          props: [{ name: 'label', type: 'string', required: false }],
        },
      },
    ],
  },
  context: { components: [] },
})

const dirtyCSS = readFileSync(join(FIXTURES, 'dirty/Hero.css'), 'utf8')
const dirtyTSX = readFileSync(join(FIXTURES, 'dirty/Hero.tsx'), 'utf8')
const cleanCSS = readFileSync(join(FIXTURES, 'clean/GoodComponent.css'), 'utf8')
const cleanTSX = readFileSync(join(FIXTURES, 'clean/GoodComponent.tsx'), 'utf8')

describe('integration: dirty fixtures produce findings', () => {
  it('css-literals: flags oklch values that match cascade tokens in Hero.css', () => {
    const findings = findCssLiteralViolations(dirtyCSS, 'Hero.css', contract)
    expect(findings.length).toBeGreaterThan(0)
    const rules = findings.map((f) => f.rule)
    expect(rules).toContain('hardcoded-value')
  })

  it('css-literals: flags inline style oklch in Hero.tsx', () => {
    const findings = findCssLiteralViolations(dirtyTSX, 'Hero.tsx', contract)
    expect(findings.length).toBeGreaterThan(0)
    expect(findings[0]).toMatchObject({ rule: 'hardcoded-value', property: 'color' })
  })

  it('jsx-props: flags unknown prop "frobnicate" on <Button>', () => {
    const findings = findJsxPropViolations(dirtyTSX, 'Hero.tsx', contract)
    expect(findings.length).toBeGreaterThan(0)
    const unknownProp = findings.find((f) => f.rule === 'unknown-prop' && f.prop === 'frobnicate')
    expect(unknownProp).toBeDefined()
    expect(unknownProp).toMatchObject({ component: 'Button', level: 'error' })
  })
})

describe('integration: clean fixtures produce zero findings (false-positive guard)', () => {
  it('css-literals: GoodComponent.css has no findings', () => {
    expect(findCssLiteralViolations(cleanCSS, 'GoodComponent.css', contract)).toEqual([])
  })

  it('css-literals: GoodComponent.tsx has no findings', () => {
    expect(findCssLiteralViolations(cleanTSX, 'GoodComponent.tsx', contract)).toEqual([])
  })

  it('jsx-props: GoodComponent.tsx has no findings', () => {
    expect(findJsxPropViolations(cleanTSX, 'GoodComponent.tsx', contract)).toEqual([])
  })

  it('required-props: GoodComponent.tsx has no findings', () => {
    expect(findRequiredPropViolations(cleanTSX, 'GoodComponent.tsx', contract)).toEqual([])
  })
})

describe('integration: --fix rewrites hex literals to tokens', () => {
  // Use an inline hex CSS so the fix applies (oklch is intentionally skipped by --fix).
  it('rewrites a single-token hex match and returns fixed count > 0', () => {
    const src = '.hero { color: #3b82f6; }'
    const result = fixCssLiterals(src, 'test.css', contract)
    expect(result.fixed).toBe(1)
    expect(result.source).toContain('var(--cascivo-color-primary)')
    expect(result.source).not.toContain('#3b82f6')
  })

  it('does not rewrite oklch literals (left for manual review)', () => {
    const src = '.hero { color: oklch(0.373 0.015 264); }'
    const result = fixCssLiterals(src, 'test.css', contract)
    expect(result.fixed).toBe(0)
    expect(result.source).toBe(src)
  })

  it('clean CSS produces zero rewrites', () => {
    const result = fixCssLiterals(cleanCSS, 'GoodComponent.css', contract)
    expect(result.fixed).toBe(0)
    expect(result.source).toBe(cleanCSS)
  })
})
