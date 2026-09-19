/**
 * The flattening contract, exercised on the constructs the shipped token files actually
 * contain. Each case below corresponds to something in `packages/tokens/src/index.css` or
 * `packages/themes/src/*.css`; none is hypothetical.
 */
import { describe, expect, it } from 'vitest'
import { extract, stripComments, stripSupports } from './extract.ts'
import { buildPalette, resolvePalette } from './resolve.ts'

const raw = (css: string) => extract(css)

describe('stripSupports', () => {
  it('drops a block whose body contains nested braces', () => {
    // The exact shape in light.css: an `@supports` wrapping a `& { … }` rule.
    const css = `
      :root {
        --cascivo-color-text-on-accent: oklch(1 0 0);
        @supports (color: contrast-color(red)) {
          & { --cascivo-color-text-on-accent: contrast-color(var(--cascivo-color-accent)); }
        }
      }`
    const out = stripSupports(css)
    expect(out).not.toContain('contrast-color')
    expect(out).toContain('oklch(1 0 0)')
  })

  it('leaves CSS without @supports untouched', () => {
    const css = ':root { --cascivo-space-4: 1rem; }'
    expect(stripSupports(css)).toBe(css)
  })
})

describe('extract', () => {
  it('lets a later declaration win, as the cascade does', () => {
    const tokens = raw(':root { --cascivo-x: 1px; }')
    extract("[data-theme='dark'] { --cascivo-x: 2px; }", tokens)
    expect(tokens.get('--cascivo-x')).toBe('2px')
  })

  it('ignores a commented-out declaration', () => {
    expect(stripComments('/* --cascivo-x: 1px; */').includes('--cascivo-x')).toBe(false)
  })
})

describe('resolvePalette', () => {
  it('follows a var() chain to a literal', () => {
    const palette = resolvePalette(
      raw(`:root {
        --cascivo-color-background: oklch(1 0 0);
        --cascivo-color-bg: var(--cascivo-color-background);
        --cascivo-color-surface: var(--cascivo-color-bg);
      }`),
    )
    expect(palette['--cascivo-color-surface']).toBe('#fff')
  })

  it('uses a var() fallback when the token is undefined', () => {
    const palette = resolvePalette(raw(':root { --cascivo-a: var(--cascivo-missing, 0.5rem); }'))
    expect(palette['--cascivo-a']).toBe('0.5rem')
  })

  it('throws on a reference cycle rather than emitting a blank colour', () => {
    expect(() =>
      resolvePalette(
        raw(':root { --cascivo-a: var(--cascivo-b); --cascivo-b: var(--cascivo-a); }'),
      ),
    ).toThrow(/cycle/i)
  })

  it('throws when an unknown token has no fallback', () => {
    expect(() => resolvePalette(raw(':root { --cascivo-a: var(--cascivo-nope); }'))).toThrow(
      /Unknown token/,
    )
  })

  it('derives a relative colour from its origin hue', () => {
    // The shape used twelve times across the themes for hover/active variants.
    const palette = resolvePalette(
      raw(`:root {
        --cascivo-color-accent: oklch(0.52 0.2 250);
        --cascivo-color-accent-hover: oklch(from var(--cascivo-color-accent) 0.45 0.2 h);
      }`),
    )
    expect(palette['--cascivo-color-accent-hover']).toMatch(/^#[0-9a-f]{3,6}$/)
    expect(palette['--cascivo-color-accent-hover']).not.toBe(palette['--cascivo-color-accent'])
  })

  it('composites a translucent colour against the theme background', () => {
    const palette = resolvePalette(
      raw(`:root {
        --cascivo-color-background: oklch(1 0 0);
        --cascivo-color-active-bg: oklch(0 0 0 / 50%);
      }`),
    )
    // Flattened, not left as rgba() — Outlook ignores alpha outright.
    expect(palette['--cascivo-color-active-bg']).toBe('#bcbcbc')
  })

  it('resolves a colour embedded in a compound value, keeping its alpha', () => {
    const palette = resolvePalette(
      raw(':root { --cascivo-shadow-xs: 0 1px 2px oklch(0 0 0 / 0.05); }'),
    )
    expect(palette['--cascivo-shadow-xs']).toBe('0 1px 2px rgba(0, 0, 0, 0.05)')
  })

  it('passes non-colour values through with var() resolved', () => {
    const palette = resolvePalette(
      raw(':root { --cascivo-space-4: 1rem; --cascivo-pad: var(--cascivo-space-4); }'),
    )
    expect(palette['--cascivo-pad']).toBe('1rem')
  })
})

describe('buildPalette', () => {
  it('lets the theme override the base tokens it redefines', () => {
    const palette = buildPalette(
      ':root { --cascivo-color-background: oklch(1 0 0); --cascivo-space-4: 1rem; }',
      "[data-theme='dark'] { --cascivo-color-background: oklch(0 0 0); }",
    )
    expect(palette['--cascivo-color-background']).toBe('#000')
    expect(palette['--cascivo-space-4']).toBe('1rem')
  })
})
