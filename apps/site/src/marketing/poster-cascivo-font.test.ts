import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('./poster.css', import.meta.url), 'utf8')

// The "Cascivo Fonts" choice keeps the poster's voice (heavy caps) and sets it in the families
// by role: Condensed display, Sans body, Serif ledes, Mono labels.
describe('Cascivo Fonts type system', () => {
  const display = css.match(/html:root\[data-font='cascivo'\]\s*:where\(([^)]*)\)\s*\{([^}]*)\}/)
  const tokens = css.match(/:root\[data-font='cascivo'\]\s*\{([^}]*)\}/)?.[1] ?? ''

  it('keeps every display headline in caps with lining tabular figures', () => {
    expect(display).not.toBeNull()
    const [, selectors, body] = display as RegExpMatchArray
    for (const s of ['.pg-display', '.cta-band h2', '.proof-hero h1', '.doc-head h1']) {
      expect(selectors).toContain(s)
    }
    expect(body).toMatch(/text-transform:\s*uppercase/)
    expect(body).toMatch(/font-variant-numeric:\s*lining-nums tabular-nums/)
    expect(selectors).not.toMatch(/eyebrow/)
  })

  it('assigns each family its role', () => {
    expect(tokens).toMatch(/--cascivo-font-display:\s*'Cascivo Condensed'/)
    expect(tokens).toMatch(/--cascivo-font-sans:\s*'Cascivo Sans'/)
    expect(tokens).toMatch(/--cascivo-font-mono:\s*'Cascivo Mono'/)
    expect(tokens).toMatch(/--cascivo-font-serif:\s*'Cascivo Serif'/)
    // One face for every small uppercase line: eyebrows match the Mono stat captions.
    expect(tokens).toMatch(/--cascivo-font-eyebrow:\s*var\(--cascivo-font-mono\)/)
  })

  it('sets ledes in Serif', () => {
    const lede = css.match(/:where\(\s*\.pg-lede,[^)]*\)\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(lede).toMatch(/font-family:\s*var\(--cascivo-font-serif\)/)
  })
})
