import { describe, expect, it } from 'vitest'
import { generateThemeCss, parseToOklch } from './theme.js'

describe('parseToOklch', () => {
  it('parses hex to OKLCH', () => {
    const o = parseToOklch('#ffffff')
    expect(o.l).toBeCloseTo(1, 2)
    expect(o.c).toBeCloseTo(0, 2)
  })

  it('round-trips an oklch() input', () => {
    const o = parseToOklch('oklch(0.62 0.21 250)')
    expect(o).toMatchObject({ l: 0.62, c: 0.21, h: 250 })
  })

  it('parses named colors and rgb()', () => {
    expect(parseToOklch('white').l).toBeCloseTo(1, 2)
    expect(parseToOklch('rgb(255 255 255)').l).toBeCloseTo(1, 2)
  })

  it('throws on an unparseable color', () => {
    expect(() => parseToOklch('not-a-color')).toThrow()
  })
})

describe('generateThemeCss', () => {
  const css = generateThemeCss({ primary: '#3b82f6', neutral: '#64748b', accent: '#8b5cf6' })

  it('scopes to the theme selector', () => {
    expect(css).toContain("[data-theme='custom']")
  })

  it('honors a custom theme name', () => {
    expect(
      generateThemeCss({ primary: 'red', neutral: 'gray', accent: 'blue' }, 'brand'),
    ).toContain("[data-theme='brand']")
  })

  it('emits the accent base as an OKLCH literal', () => {
    expect(css).toMatch(/--cascivo-color-accent: oklch\([\d. ]+\);/)
  })

  it('derives hover via relative color syntax (post-2 technique)', () => {
    expect(css).toContain('--cascivo-color-accent-hover: oklch(from var(--cascivo-color-accent)')
  })

  it('computes on-color via contrast-color()', () => {
    expect(css).toContain(
      '--cascivo-color-text-on-accent: contrast-color(var(--cascivo-color-accent));',
    )
  })

  it('precedes every derived/contrast value with a static OKLCH fallback', () => {
    // Each progressive declaration must be immediately preceded by a same-property
    // static fallback. Walk the lines and assert the contract.
    const lines = css.split('\n').map((l) => l.trim())
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!
      const m = /^(--cascivo-[\w-]+):\s*(oklch\(from|contrast-color\()/.exec(line)
      if (!m) continue
      const prop = m[1]!
      const prev = lines[i - 1] ?? ''
      expect(prev.startsWith(`${prop}:`), `${prop} progressive value lacks a static fallback`).toBe(
        true,
      )
      expect(
        /oklch\(from|contrast-color\(|var\(/.test(prev),
        `${prop} fallback is not static`,
      ).toBe(false)
    }
  })

  it('emits no hex literals (all-OKLCH invariant)', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,6}\b/)
  })

  it('uses no color-mix ladders', () => {
    expect(css).not.toContain('color-mix(')
  })
})
