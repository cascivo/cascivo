import { describe, expect, it } from 'vitest'
import { findUnlayeredRules } from './css-layers.js'

describe('findUnlayeredRules', () => {
  it('flags a top-level style rule outside any @layer', () => {
    const out = findUnlayeredRules('.card { color: red; }')
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ line: 1, selector: '.card' })
  })

  it('passes a rule inside @layer', () => {
    expect(findUnlayeredRules('@layer cascivo.component { .card { color: red; } }')).toEqual([])
  })

  it('passes a rule inside a group at-rule inside @layer', () => {
    const css = '@layer cascivo.component { @media (min-width: 40rem) { .card { gap: 1rem; } } }'
    expect(findUnlayeredRules(css)).toEqual([])
  })

  it('flags a rule inside a top-level normal @media (media is transparent to layering)', () => {
    const out = findUnlayeredRules('@media (min-width: 40rem) { .card { gap: 1rem; } }')
    expect(out).toHaveLength(1)
    expect(out[0]?.selector).toBe('.card')
  })

  it('exempts top-level accessibility-guarantee media queries', () => {
    expect(
      findUnlayeredRules('@media (forced-colors: active) { .card { border: 1px solid; } }'),
    ).toEqual([])
    expect(
      findUnlayeredRules('@media (prefers-reduced-motion: reduce) { .x { transition: none; } }'),
    ).toEqual([])
    expect(
      findUnlayeredRules('@media (prefers-contrast: more) { .x { outline: 2px solid; } }'),
    ).toEqual([])
  })

  it('ignores @import / @charset / @layer statements (no block)', () => {
    const css = `@charset "utf-8";\n@import url('x.css') layer(vendor);\n@layer a, b;`
    expect(findUnlayeredRules(css)).toEqual([])
  })

  it('ignores @keyframes and @property blocks', () => {
    expect(
      findUnlayeredRules('@keyframes spin { from { rotate: 0deg; } to { rotate: 360deg; } }'),
    ).toEqual([])
    expect(findUnlayeredRules('@property --x { syntax: "<color>"; inherits: false; }')).toEqual([])
  })

  it('reports only the outermost unlayered rule, not nested children', () => {
    const out = findUnlayeredRules('.card { color: red; .title { font-weight: 700; } }')
    expect(out).toHaveLength(1)
    expect(out[0]?.selector).toBe('.card')
  })

  it('is not fooled by braces inside comments or strings', () => {
    const css = `/* .fake { } */ @layer cascivo.component { .real { content: "}"; } }`
    expect(findUnlayeredRules(css)).toEqual([])
  })

  it('reports the correct line number', () => {
    const css = `@layer cascivo.component {\n  .a { color: red; }\n}\n\n.leaked { color: blue; }`
    const out = findUnlayeredRules(css)
    expect(out).toHaveLength(1)
    expect(out[0]?.line).toBe(5)
  })
})
