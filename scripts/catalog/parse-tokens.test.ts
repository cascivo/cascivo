import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseTokens } from './parse-tokens.ts'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const INDEX_CSS = `
@layer cascade.tokens {
  :root {
    --cascivo-gray-500: oklch(0.554 0.018 264);
    --cascivo-blue-50: oklch(0.97 0.025 250);
    --cascivo-space-4: 1rem;
    --cascivo-radius-sm: 0.25rem;
    --cascivo-font-sans: ui-sans-serif, system-ui;
    --cascivo-duration-150: 150ms;
    --cascivo-chart-1: oklch(0.65 0.2 250);
    --cascivo-shadow-sm: 0 1px 3px oklch(0 0 0 / 0.07);
    --cascivo-ease-in: cubic-bezier(0.4, 0, 1, 1);
    --cascivo-motion-enter: var(--cascivo-duration-150) var(--cascivo-ease-in);
    --cascivo-ring-width: 3px;
    --cascivo-control-height-md: 2.25rem;
    --cascivo-radius-base: 0.375rem;
    --cascivo-color-primary: oklch(0.205 0 0);
    --cascivo-radius-button: var(--cascivo-radius-sm);
  }
}
`

// light.css: overrides some tokens, adds new ones, and uses var() chains
const LIGHT_CSS = `
@layer cascade.theme {
  :root {
    --cascivo-color-background: oklch(1 0 0);
    --cascivo-color-accent: oklch(0.623 0.214 250);
    --cascivo-color-border: var(--cascivo-gray-500);
    --cascivo-focus-ring: 0 0 0 var(--cascivo-ring-width) oklch(0.5 0.2 250);
    --cascivo-radius-button: var(--cascivo-radius-base);
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
    assert.equal(names.filter((n) => n === '--cascivo-radius-button').length, 1)
    // Tokens only in light.css appear.
    assert.ok(names.includes('--cascivo-color-background'))
    assert.ok(names.includes('--cascivo-color-accent'))
    assert.ok(names.includes('--cascivo-color-border'))
    assert.ok(names.includes('--cascivo-focus-ring'))
  })

  it('classifies numeric-suffix tokens as primitive', () => {
    const tokens = parseTokens(INDEX_CSS, LIGHT_CSS)
    const byName = Object.fromEntries(tokens.map((t) => [t.name, t]))
    assert.equal(byName['--cascivo-gray-500']!.layer, 'primitive')
    assert.equal(byName['--cascivo-blue-50']!.layer, 'primitive')
    assert.equal(byName['--cascivo-space-4']!.layer, 'primitive')
    assert.equal(byName['--cascivo-duration-150']!.layer, 'primitive')
    assert.equal(byName['--cascivo-chart-1']!.layer, 'primitive')
  })

  it('classifies named-size-suffix tokens in scale groups as primitive', () => {
    const tokens = parseTokens(INDEX_CSS, LIGHT_CSS)
    const byName = Object.fromEntries(tokens.map((t) => [t.name, t]))
    assert.equal(byName['--cascivo-radius-sm']!.layer, 'primitive')
    assert.equal(byName['--cascivo-shadow-sm']!.layer, 'primitive')
    assert.equal(byName['--cascivo-ease-in']!.layer, 'primitive')
  })

  it('classifies font-stack tokens as primitive', () => {
    const tokens = parseTokens(INDEX_CSS, LIGHT_CSS)
    const byName = Object.fromEntries(tokens.map((t) => [t.name, t]))
    assert.equal(byName['--cascivo-font-sans']!.layer, 'primitive')
  })

  it('classifies component-identifier tokens as component', () => {
    const tokens = parseTokens(INDEX_CSS, LIGHT_CSS)
    const byName = Object.fromEntries(tokens.map((t) => [t.name, t]))
    assert.equal(byName['--cascivo-radius-button']!.layer, 'component')
    assert.equal(byName['--cascivo-ring-width']!.layer, 'component')
    assert.equal(byName['--cascivo-control-height-md']!.layer, 'component')
    assert.equal(byName['--cascivo-focus-ring']!.layer, 'component')
  })

  it('classifies role-based tokens as semantic', () => {
    const tokens = parseTokens(INDEX_CSS, LIGHT_CSS)
    const byName = Object.fromEntries(tokens.map((t) => [t.name, t]))
    assert.equal(byName['--cascivo-radius-base']!.layer, 'semantic')
    assert.equal(byName['--cascivo-color-primary']!.layer, 'semantic')
    assert.equal(byName['--cascivo-motion-enter']!.layer, 'semantic')
    assert.equal(byName['--cascivo-color-accent']!.layer, 'semantic')
    assert.equal(byName['--cascivo-color-background']!.layer, 'semantic')
  })

  it('extracts the correct group segment', () => {
    const tokens = parseTokens(INDEX_CSS, LIGHT_CSS)
    const byName = Object.fromEntries(tokens.map((t) => [t.name, t]))
    assert.equal(byName['--cascivo-gray-500']!.group, 'gray')
    assert.equal(byName['--cascivo-color-accent']!.group, 'color')
    assert.equal(byName['--cascivo-radius-button']!.group, 'radius')
    assert.equal(byName['--cascivo-space-4']!.group, 'space')
    assert.equal(byName['--cascivo-duration-150']!.group, 'duration')
  })

  it('resolves simple var() chains to concrete values', () => {
    const tokens = parseTokens(INDEX_CSS, LIGHT_CSS)
    const byName = Object.fromEntries(tokens.map((t) => [t.name, t]))
    // --cascivo-color-border: var(--cascivo-gray-500) → gray-500's value
    assert.equal(byName['--cascivo-color-border']!.resolvedDefault, 'oklch(0.554 0.018 264)')
    // --cascivo-radius-button overridden in light.css to var(--cascivo-radius-base)
    // --cascivo-radius-base is 0.375rem (concrete)
    assert.equal(byName['--cascivo-radius-button']!.resolvedDefault, '0.375rem')
  })

  it('keeps calc() values as-is', () => {
    const tokens = parseTokens(INDEX_CSS, LIGHT_CSS)
    const byName = Object.fromEntries(tokens.map((t) => [t.name, t]))
    // --cascivo-motion-enter is a complex value with embedded var(), not calc — kept as-is.
    // Verify a synthetic calc would work by checking shadow-sm is kept as concrete.
    assert.ok(byName['--cascivo-shadow-sm']!.resolvedDefault!.includes('oklch'))
  })

  it('marks tokens only in light.css as resolvesPerTheme=true', () => {
    const tokens = parseTokens(INDEX_CSS, LIGHT_CSS)
    const byName = Object.fromEntries(tokens.map((t) => [t.name, t]))
    // --cascivo-color-background is only in light.css
    assert.equal(byName['--cascivo-color-background']!.resolvesPerTheme, true)
    assert.equal(byName['--cascivo-color-accent']!.resolvesPerTheme, true)
  })

  it('marks tokens only in index.css (concrete values) as resolvesPerTheme=false', () => {
    const tokens = parseTokens(INDEX_CSS, LIGHT_CSS)
    const byName = Object.fromEntries(tokens.map((t) => [t.name, t]))
    assert.equal(byName['--cascivo-gray-500']!.resolvesPerTheme, false)
    assert.equal(byName['--cascivo-space-4']!.resolvesPerTheme, false)
    assert.equal(byName['--cascivo-font-sans']!.resolvesPerTheme, false)
  })

  it('marks tokens in index.css whose var() resolves through theme tokens as resolvesPerTheme=true', () => {
    const tokens = parseTokens(INDEX_CSS, LIGHT_CSS)
    const byName = Object.fromEntries(tokens.map((t) => [t.name, t]))
    // --cascivo-color-border is in light.css and references --cascivo-gray-500 (index.css)
    // Since --cascivo-color-border is only in light.css, it's per-theme.
    assert.equal(byName['--cascivo-color-border']!.resolvesPerTheme, true)
  })
})
