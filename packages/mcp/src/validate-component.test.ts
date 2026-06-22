import { describe, expect, it } from 'vitest'
import { validateComponentSource } from './validate-component.js'

describe('validateComponentSource — banned hooks', () => {
  it('flags useState and useEffect', () => {
    const tsx = `import { useState, useEffect } from 'react'
export function Bad() {
  const [n, setN] = useState(0)
  useEffect(() => {}, [])
  return <div>{n}</div>
}`
    const result = validateComponentSource({ tsx, name: 'Bad' })
    expect(result.valid).toBe(false)
    const rules = result.violations.map((v) => v.rule)
    expect(rules).toContain('banned-hook')
    expect(result.violations.some((v) => v.detail.includes('useSignalEffect'))).toBe(true)
  })

  it('passes signal-based source', () => {
    const tsx = `import { useSignal } from '@cascivo/core'
export function Good() {
  const n = useSignal(0)
  return <div>{n.value}</div>
}`
    const result = validateComponentSource({ tsx })
    expect(result.valid).toBe(true)
    expect(result.violations).toHaveLength(0)
  })
})

describe('validateComponentSource — breakpoints', () => {
  it('flags an off-scale container width', () => {
    const css = `.x { display: grid; }
@container (min-width: 33rem) { .x { gap: 1rem; } }`
    const result = validateComponentSource({ css })
    expect(result.valid).toBe(false)
    expect(result.violations[0]?.rule).toBe('off-scale-breakpoint')
    expect(result.violations[0]?.line).toBe(2)
  })

  it('accepts canonical widths', () => {
    const css = `@container (min-width: 40rem) { .x { gap: 1rem; } }`
    expect(validateComponentSource({ css }).valid).toBe(true)
  })

  it('ignores non-width media features', () => {
    const css = `@media (prefers-reduced-motion: reduce) { .x { transition: none; } }`
    expect(validateComponentSource({ css }).valid).toBe(true)
  })
})

describe('validateComponentSource — CSS fallback contract', () => {
  it('flags a @function call with no preceding static fallback', () => {
    const css = `.x {
  padding-block: --cascivo-step(2);
}`
    const result = validateComponentSource({ css })
    expect(result.valid).toBe(false)
    expect(result.violations[0]?.rule).toBe('missing-css-fallback')
  })

  it('accepts a @function call preceded by a static fallback', () => {
    const css = `.x {
  padding-block: 0.5rem;
  padding-block: --cascivo-step(2);
}`
    expect(validateComponentSource({ css }).valid).toBe(true)
  })
})

describe('validateComponentSource — token hallucination', () => {
  const tokenNames = new Set(['--cascivo-color-accent', '--cascivo-radius-button'])

  it('flags a token outside the catalog', () => {
    const css = `.x { background: var(--cascivo-color-accent); border-color: var(--cascivo-color-made-up); }`
    const result = validateComponentSource({ css }, { tokenNames })
    expect(result.valid).toBe(false)
    expect(result.violations.map((v) => v.detail).join(' ')).toContain('--cascivo-color-made-up')
  })

  it('passes when all tokens are in the catalog', () => {
    const css = `.x { background: var(--cascivo-color-accent); border-radius: var(--cascivo-radius-button); }`
    expect(validateComponentSource({ css }, { tokenNames }).valid).toBe(true)
  })

  it('skips the token check when no catalog is supplied', () => {
    const css = `.x { background: var(--cascivo-color-anything); }`
    expect(validateComponentSource({ css }).valid).toBe(true)
  })
})
