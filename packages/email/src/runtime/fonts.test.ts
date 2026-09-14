import { describe, expect, it } from 'vitest'
import { PALETTES } from '../tokens/palettes.generated.ts'
import { EMAIL_FONTS, EMAIL_FONT_TOKENS, emailSafeStack, fontStack } from './fonts.ts'
import { withPalette } from './palette.ts'

describe('emailSafeStack', () => {
  it('drops the UA generics that resolve to nothing in Outlook Windows', () => {
    expect(emailSafeStack(PALETTES.light['--cascivo-font-sans']!)).toBe(
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    )
  })

  it('keeps a quoted family name whole, commas inside it included', () => {
    expect(emailSafeStack(`'Foo, Bar', Arial`)).toBe(`'Foo, Bar', Arial`)
  })

  it('drops CSS-wide keywords, which are not family names at all', () => {
    expect(emailSafeStack('inherit, Arial')).toBe('Arial')
  })

  it('reports nothing usable rather than an empty declaration', () => {
    // An empty font-family would be dropped by the client and hand the element back to its
    // default face — worse than the built-in stack the caller falls back to.
    expect(emailSafeStack('system-ui, ui-sans-serif')).toBeUndefined()
  })
})

describe('EMAIL_FONT_TOKENS', () => {
  it('names a key for every family, and no shipped theme sets one', () => {
    // The keys are palette-only by design — see the constant's docstring. If a theme ever
    // starts declaring them, `fontStack`'s documented "defaults are unchanged" stops being
    // true and this is where that shows up.
    for (const family of ['sans', 'serif', 'mono'] as const) {
      expect(EMAIL_FONT_TOKENS[family]).toBe(`--cascivo-email-font-${family}`)
      for (const [theme, palette] of Object.entries(PALETTES)) {
        expect(palette, `${theme} declares ${EMAIL_FONT_TOKENS[family]}`).not.toHaveProperty(
          EMAIL_FONT_TOKENS[family],
        )
      }
    }
  })
})

describe('fontStack', () => {
  it('returns the built-in stack with no palette in scope', () => {
    // Exported for templates and fixtures that are not inside a render.
    expect(fontStack('sans')).toBe(EMAIL_FONTS.sans)
    expect(fontStack('mono')).toBe(EMAIL_FONTS.mono)
  })

  it('ignores the browser font token, which names faces email cannot use', () => {
    // PALETTES.light carries both; only --cascivo-email-font-sans may reach the output.
    expect(PALETTES.light['--cascivo-font-sans']).toContain('ui-sans-serif')
    withPalette(PALETTES.light, () => {
      expect(fontStack('sans')).toBe(EMAIL_FONTS.sans)
    })
  })

  it('honours --cascivo-email-font-sans from the palette', () => {
    withPalette({ ...PALETTES.light, '--cascivo-email-font-sans': 'Arial, sans-serif' }, () => {
      expect(fontStack('sans')).toBe('Arial, sans-serif')
    })
  })

  it('sanitises an override that was pasted from a browser stack', () => {
    withPalette(
      { ...PALETTES.light, '--cascivo-email-font-mono': 'ui-monospace, Menlo, monospace' },
      () => {
        expect(fontStack('mono')).toBe('Menlo, monospace')
      },
    )
  })

  it('falls back when an override leaves nothing usable', () => {
    withPalette({ ...PALETTES.light, '--cascivo-email-font-serif': 'system-ui' }, () => {
      expect(fontStack('serif')).toBe(EMAIL_FONTS.serif)
    })
  })
})
