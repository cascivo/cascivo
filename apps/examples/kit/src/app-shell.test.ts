import { describe, it, expect } from 'vitest'
import { themeFromSearch } from './app-shell'

describe('themeFromSearch', () => {
  it('reads a known theme', () => {
    expect(themeFromSearch('?theme=light')).toBe('light')
    expect(themeFromSearch('?foo=1&theme=warm')).toBe('warm')
    expect(themeFromSearch('?theme=brutalist')).toBe('brutalist')
  })

  it('ignores an absent or unknown theme', () => {
    expect(themeFromSearch('')).toBeNull()
    expect(themeFromSearch('?theme=')).toBeNull()
    expect(themeFromSearch('?theme=neon')).toBeNull()
  })
})
