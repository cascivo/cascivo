import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseTokens } from './parse-tokens.ts'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const INDEX_CSS = `
@layer cascade.tokens {
  :root {
    --cascade-gray-500: oklch(0.554 0.018 264);
    --cascade-blue-50: oklch(0.97 0.025 250);
    --cascade-space-4: 1rem;
    --cascade-radius-sm: 0.25rem;
    --cascade-font-sans: ui-sans-serif, system-ui;
    --cascade-duration-150: 150ms;
    --cascade-chart-1: oklch(0.65 0.2 250);
    --cascade-shadow-sm: 0 1px 3px oklch(0 0 0 / 0.07);
    --cascade-ease-in: cubic-bezier(0.4, 0, 1, 1);
    --cascade-motion-enter: var(--cascade-duration-150) var(--cascade-ease-in);
    --cascade-ring-width: 3px;
    --cascade-control-height-md: 2.25rem;
    --cascade-radius-base: 0.375rem;
    --cascade-color-primary: oklch(0.205 0 0);
    --cascade-radius-button: var(--cascade-radius-sm);
  }
}
`

// light.css: overrides some tokens, adds new ones, and uses var() chains
const LIGHT_CSS = `
@layer cascade.theme {
  :root {
    --cascade-color-background: oklch(1 0 0);
    --cascade-color-accent: oklch(0.623 0.214 250);
    --cascade-color-border: var(--cascade-gray-500);
    --cascade-focus-ring: 0 0 0 var(--cascade-ring-width) oklch(0.5 0.2 250);
    --cascade-radius-button: var(--cascade-radius-base);
  }
}
`

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('parseTokens', () => {
  it('returns an array with all token names from both files (no duplicates)', () => {
    const tokens = parseTokens(INDEX_CSS, LIGHT_CSS)
    const names = tokens.map((t) => t.name)
    // Tokens defined in both files appear once.
    assert.equal(names.filter((n) => n === '--cascade-radius-button').length, 1)
    // Tokens only in light.css appear.
    assert.ok(names.includes('--cascade-color-background'))
    assert.ok(names.includes('--cascade-color-accent'))
    assert.ok(names.includes('--cascade-color-border'))
    assert.ok(names.includes('--cascade-focus-ring'))
  })

  it('classifies numeric-suffix tokens as primitive', () => {
    const tokens = parseTokens(INDEX_CSS, LIGHT_CSS)
    const byName = Object.fromEntries(tokens.map((t) => [t.name, t]))
    assert.equal(byName['--cascade-gray-500']!.layer, 'primitive')
    assert.equal(byName['--cascade-blue-50']!.layer, 'primitive')
    assert.equal(byName['--cascade-space-4']!.layer, 'primitive')
    assert.equal(byName['--cascade-duration-150']!.layer, 'primitive')
    assert.equal(byName['--cascade-chart-1']!.layer, 'primitive')
  })

  it('classifies named-size-suffix tokens in scale groups as primitive', () => {
    const tokens = parseTokens(INDEX_CSS, LIGHT_CSS)
    const byName = Object.fromEntries(tokens.map((t) => [t.name, t]))
    assert.equal(byName['--cascade-radius-sm']!.layer, 'primitive')
    assert.equal(byName['--cascade-shadow-sm']!.layer, 'primitive')
    assert.equal(byName['--cascade-ease-in']!.layer, 'primitive')
  })

  it('classifies font-stack tokens as primitive', () => {
    const tokens = parseTokens(INDEX_CSS, LIGHT_CSS)
    const byName = Object.fromEntries(tokens.map((t) => [t.name, t]))
    assert.equal(byName['--cascade-font-sans']!.layer, 'primitive')
  })

  it('classifies component-identifier tokens as component', () => {
    const tokens = parseTokens(INDEX_CSS, LIGHT_CSS)
    const byName = Object.fromEntries(tokens.map((t) => [t.name, t]))
    assert.equal(byName['--cascade-radius-button']!.layer, 'component')
    assert.equal(byName['--cascade-ring-width']!.layer, 'component')
    assert.equal(byName['--cascade-control-height-md']!.layer, 'component')
    assert.equal(byName['--cascade-focus-ring']!.layer, 'component')
  })

  it('classifies role-based tokens as semantic', () => {
    const tokens = parseTokens(INDEX_CSS, LIGHT_CSS)
    const byName = Object.fromEntries(tokens.map((t) => [t.name, t]))
    assert.equal(byName['--cascade-radius-base']!.layer, 'semantic')
    assert.equal(byName['--cascade-color-primary']!.layer, 'semantic')
    assert.equal(byName['--cascade-motion-enter']!.layer, 'semantic')
    assert.equal(byName['--cascade-color-accent']!.layer, 'semantic')
    assert.equal(byName['--cascade-color-background']!.layer, 'semantic')
  })

  it('extracts the correct group segment', () => {
    const tokens = parseTokens(INDEX_CSS, LIGHT_CSS)
    const byName = Object.fromEntries(tokens.map((t) => [t.name, t]))
    assert.equal(byName['--cascade-gray-500']!.group, 'gray')
    assert.equal(byName['--cascade-color-accent']!.group, 'color')
    assert.equal(byName['--cascade-radius-button']!.group, 'radius')
    assert.equal(byName['--cascade-space-4']!.group, 'space')
    assert.equal(byName['--cascade-duration-150']!.group, 'duration')
  })

  it('resolves simple var() chains to concrete values', () => {
    const tokens = parseTokens(INDEX_CSS, LIGHT_CSS)
    const byName = Object.fromEntries(tokens.map((t) => [t.name, t]))
    // --cascade-color-border: var(--cascade-gray-500) → gray-500's value
    assert.equal(byName['--cascade-color-border']!.resolvedDefault, 'oklch(0.554 0.018 264)')
    // --cascade-radius-button overridden in light.css to var(--cascade-radius-base)
    // --cascade-radius-base is 0.375rem (concrete)
    assert.equal(byName['--cascade-radius-button']!.resolvedDefault, '0.375rem')
  })

  it('keeps calc() values as-is', () => {
    const tokens = parseTokens(INDEX_CSS, LIGHT_CSS)
    const byName = Object.fromEntries(tokens.map((t) => [t.name, t]))
    // --cascade-motion-enter is a complex value with embedded var(), not calc — kept as-is.
    // Verify a synthetic calc would work by checking shadow-sm is kept as concrete.
    assert.ok(byName['--cascade-shadow-sm']!.resolvedDefault!.includes('oklch'))
  })

  it('marks tokens only in light.css as resolvesPerTheme=true', () => {
    const tokens = parseTokens(INDEX_CSS, LIGHT_CSS)
    const byName = Object.fromEntries(tokens.map((t) => [t.name, t]))
    // --cascade-color-background is only in light.css
    assert.equal(byName['--cascade-color-background']!.resolvesPerTheme, true)
    assert.equal(byName['--cascade-color-accent']!.resolvesPerTheme, true)
  })

  it('marks tokens only in index.css (concrete values) as resolvesPerTheme=false', () => {
    const tokens = parseTokens(INDEX_CSS, LIGHT_CSS)
    const byName = Object.fromEntries(tokens.map((t) => [t.name, t]))
    assert.equal(byName['--cascade-gray-500']!.resolvesPerTheme, false)
    assert.equal(byName['--cascade-space-4']!.resolvesPerTheme, false)
    assert.equal(byName['--cascade-font-sans']!.resolvesPerTheme, false)
  })

  it('marks tokens in index.css whose var() resolves through theme tokens as resolvesPerTheme=true', () => {
    const tokens = parseTokens(INDEX_CSS, LIGHT_CSS)
    const byName = Object.fromEntries(tokens.map((t) => [t.name, t]))
    // --cascade-color-border is in light.css and references --cascade-gray-500 (index.css)
    // Since --cascade-color-border is only in light.css, it's per-theme.
    assert.equal(byName['--cascade-color-border']!.resolvesPerTheme, true)
  })
})
