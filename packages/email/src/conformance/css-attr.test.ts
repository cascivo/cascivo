/**
 * Regression tests for the entity-splitting bug.
 *
 * A style attribute is HTML-escaped, so a font stack arrives with `&#x27;` around the quoted
 * family names — and that entity ends in a semicolon. Splitting on `;` therefore cut the
 * font stack in half, and the simulator wrote the wreckage back into the document. Every
 * unit test passed: they asserted on slug values, never on the reconstructed CSS. The bug
 * was only visible as Times New Roman in a real browser.
 */
import { describe, expect, it } from 'vitest'
import { EMAIL_FONTS } from '../runtime/fonts.ts'
import {
  decodeAttribute,
  encodeAttribute,
  parseDeclarations,
  serializeDeclarations,
} from './css-attr.ts'

/** Exactly what React emits for the sans stack inside a style attribute. */
const ESCAPED_SANS = EMAIL_FONTS.sans.replaceAll("'", '&#x27;')

describe('decodeAttribute', () => {
  it('restores the apostrophes React escaped', () => {
    expect(decodeAttribute(ESCAPED_SANS)).toBe(EMAIL_FONTS.sans)
  })

  it('decodes &amp; last, so &amp;#x27; does not become an apostrophe', () => {
    expect(decodeAttribute('&amp;#x27;')).toBe('&#x27;')
  })
})

describe('encodeAttribute', () => {
  it('round-trips', () => {
    expect(decodeAttribute(encodeAttribute(EMAIL_FONTS.sans))).toBe(EMAIL_FONTS.sans)
  })

  it('escapes & first, so an ampersand is not double-decoded later', () => {
    expect(encodeAttribute('a & b')).toBe('a &amp; b')
  })
})

describe('parseDeclarations', () => {
  it('keeps a quoted font stack whole', () => {
    const declarations = parseDeclarations(
      decodeAttribute(`font-family:${ESCAPED_SANS};color:#fff`),
    )
    expect(declarations).toHaveLength(2)
    expect(declarations[0]).toEqual({ property: 'font-family', value: EMAIL_FONTS.sans })
    expect(declarations[1]).toEqual({ property: 'color', value: '#fff' })
  })

  it('does not split on a semicolon inside a function', () => {
    const declarations = parseDeclarations('background:url(a;b.png);color:red')
    expect(declarations).toHaveLength(2)
    expect(declarations[0]?.value).toBe('url(a;b.png)')
  })

  it('drops fragments with no colon rather than inventing a declaration', () => {
    expect(parseDeclarations('color:red;;garbage;')).toEqual([{ property: 'color', value: 'red' }])
  })

  it('survives a trailing semicolon', () => {
    expect(parseDeclarations('color:red;')).toEqual([{ property: 'color', value: 'red' }])
  })
})

describe('serializeDeclarations', () => {
  it('round-trips a real style attribute', () => {
    const css = `display:inline-block;padding:12px 24px;font-family:${EMAIL_FONTS.sans};color:#fff`
    expect(serializeDeclarations(parseDeclarations(css))).toBe(css)
  })
})
