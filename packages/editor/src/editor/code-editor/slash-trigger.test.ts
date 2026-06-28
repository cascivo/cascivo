import { describe, expect, it } from 'vitest'
import { detectTrigger, filterCommands } from './slash-trigger.ts'

describe('detectTrigger', () => {
  it('opens on a bare slash at the document start', () => {
    expect(detectTrigger('/', 1)).toEqual({ start: 0, query: '' })
  })

  it('captures the query after the slash', () => {
    expect(detectTrigger('/he', 3)).toEqual({ start: 0, query: 'he' })
  })

  it('opens after whitespace (word boundary)', () => {
    expect(detectTrigger('foo /he', 7)).toEqual({ start: 4, query: 'he' })
  })

  it('opens at the start of a new line', () => {
    expect(detectTrigger('a\n/he', 5)).toEqual({ start: 2, query: 'he' })
  })

  it('does not open for a slash mid-word', () => {
    expect(detectTrigger('a/he', 4)).toBeNull()
    expect(detectTrigger('http://x', 8)).toBeNull()
  })

  it('closes once the query contains whitespace', () => {
    expect(detectTrigger('/he llo', 7)).toBeNull()
  })

  it('returns null with no slash before the caret', () => {
    expect(detectTrigger('hello', 5)).toBeNull()
  })
})

describe('filterCommands', () => {
  const cmds = [
    { label: 'Heading', keywords: ['title', 'h1'] },
    { label: 'Code block', keywords: ['fence'] },
    { label: 'Date' },
  ]

  it('returns all for an empty query', () => {
    expect(filterCommands(cmds, '')).toHaveLength(3)
  })

  it('matches the label case-insensitively', () => {
    expect(filterCommands(cmds, 'cod').map((c) => c.label)).toEqual(['Code block'])
  })

  it('matches a keyword', () => {
    expect(filterCommands(cmds, 'title').map((c) => c.label)).toEqual(['Heading'])
  })

  it('preserves input order', () => {
    expect(filterCommands(cmds, 'e').map((c) => c.label)).toEqual(['Heading', 'Code block', 'Date'])
  })
})
