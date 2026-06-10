import { describe, expect, it } from 'vitest'
import { generateThemeCss } from './theme.js'

describe('generateThemeCss', () => {
  const css = generateThemeCss({ primary: '#3b82f6', neutral: '#64748b', accent: '#8b5cf6' })

  it('scopes to the theme selector', () => {
    expect(css).toContain("[data-theme='custom']")
  })

  it('maps the primary color to the accent token', () => {
    expect(css).toContain('--cascade-color-accent: #3b82f6;')
  })

  it('derives hover via color-mix', () => {
    expect(css).toContain('--cascade-color-accent-hover: color-mix(in oklab, #3b82f6, black 12%);')
  })

  it('uses the accent color for the focus ring', () => {
    expect(css).toContain('--cascade-color-focus-ring: #8b5cf6;')
  })

  it('honors a custom theme name', () => {
    expect(
      generateThemeCss({ primary: 'red', neutral: 'gray', accent: 'blue' }, 'brand'),
    ).toContain("[data-theme='brand']")
  })
})
