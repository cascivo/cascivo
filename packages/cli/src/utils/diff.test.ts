import { describe, expect, it } from 'vitest'
import { diffLines, hasChanges } from './diff.js'

describe('diffLines', () => {
  it('marks added and removed lines, keeps context', () => {
    const out = diffLines('a\nb\nc', 'a\nB\nc')
    expect(out).toEqual(['  a', '- b', '+ B', '  c'])
  })

  it('handles pure additions', () => {
    expect(diffLines('a', 'a\nb')).toEqual(['  a', '+ b'])
  })

  it('handles pure removals', () => {
    expect(diffLines('a\nb', 'a')).toEqual(['  a', '- b'])
  })
})

describe('hasChanges', () => {
  it('detects equality and difference', () => {
    expect(hasChanges('x', 'x')).toBe(false)
    expect(hasChanges('x', 'y')).toBe(true)
  })
})
