import { describe, expect, it } from 'vitest'
import { EMPTY, NO_MATCH } from './EVAL.ts'

describe('filter-empty-state EVAL', () => {
  // An app that echoes the query ("Filter: …") would otherwise pass without any empty state.
  it('uses a query that does not itself read as an empty-state message', () => {
    expect(EMPTY.test(NO_MATCH)).toBe(false)
    expect(EMPTY.test(`Filter: ${NO_MATCH}`)).toBe(false)
  })

  it('recognises the usual empty-state wordings', () => {
    for (const text of [
      'No members match',
      'Nothing matched your filter',
      'No results',
      'Nobody found',
    ])
      expect(EMPTY.test(text)).toBe(true)
  })
})
