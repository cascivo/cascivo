import { describe, it, expect } from 'vitest'
import { themeFromMessage, themeFromSearch } from './app-shell'

describe('themeFromSearch', () => {
  it('reads a known theme', () => {
    expect(themeFromSearch('?theme=light')).toBe('light')
    expect(themeFromSearch('?foo=1&theme=warm')).toBe('warm')
    expect(themeFromSearch('?theme=brutalist')).toBe('brutalist')
    expect(themeFromSearch('?theme=poster-dark')).toBe('poster-dark')
  })

  it('ignores an absent or unknown theme', () => {
    expect(themeFromSearch('')).toBeNull()
    expect(themeFromSearch('?theme=')).toBeNull()
    expect(themeFromSearch('?theme=neon')).toBeNull()
  })
})

describe('themeFromMessage', () => {
  it('reads a theme message', () => {
    expect(themeFromMessage({ type: 'cascivo:theme', theme: 'poster' })).toBe('poster')
    expect(themeFromMessage({ type: 'cascivo:theme', theme: 'cyberpunk' })).toBe('cyberpunk')
  })

  it('ignores other messages and unknown themes', () => {
    expect(themeFromMessage(null)).toBeNull()
    expect(themeFromMessage('poster')).toBeNull()
    expect(themeFromMessage({ type: 'other', theme: 'poster' })).toBeNull()
    expect(themeFromMessage({ type: 'cascivo:theme', theme: 'neon' })).toBeNull()
    expect(themeFromMessage({ type: 'cascivo:theme' })).toBeNull()
  })
})
