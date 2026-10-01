// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  CODE_ALPHABET,
  parseAskInput,
  parseCode,
  parsePoll,
  parsePollInput,
  parsePresence,
  pollShares,
} from './model'
import type { Poll } from './model'

const poll = (counts: number[]): Poll => ({
  id: 'poll000001',
  question: 'Q?',
  options: counts.map((_, i) => `Option ${i}`),
  counts,
  open: true,
  at: 0,
})

describe('parseCode', () => {
  it('upper-cases and trims a typed code', () => {
    expect(parseCode(' abc234 ')).toBe('ABC234')
  })

  it('refuses characters a projector makes ambiguous, and wrong lengths', () => {
    for (const code of ['ABC230', 'ABCI34', 'ABC23', 'ABC2345', '../../x']) {
      expect(() => parseCode(code)).toThrow()
    }
    expect(CODE_ALPHABET).not.toMatch(/[01IOL]/)
  })
})

describe('pollShares', () => {
  it('rounds to whole percentages that always add up to 100', () => {
    expect(pollShares(poll([1, 1, 1]))).toEqual([34, 33, 33])
    expect(pollShares(poll([2, 1]))).toEqual([67, 33])
    for (const counts of [
      [7, 3, 5],
      [1, 0, 0, 0],
      [13, 29, 1, 8, 4],
    ]) {
      expect(pollShares(poll(counts)).reduce((a, b) => a + b, 0)).toBe(100)
    }
  })

  it('is all zeros with no votes', () => {
    expect(pollShares(poll([0, 0]))).toEqual([0, 0])
  })
})

describe('parsers', () => {
  it('cleans whitespace and treats a blank name as anonymous', () => {
    expect(parseAskInput({ text: ' a\n\n b ', author: '  ', voter: 'voter-0001' })).toEqual({
      text: 'a b',
      author: null,
      voter: 'voter-0001',
    })
  })

  it('drops blank poll options and enforces 2–6', () => {
    expect(parsePollInput({ question: 'Q', options: ['A', ' ', 'B'] }).options).toEqual(['A', 'B'])
    expect(() => parsePollInput({ question: 'Q', options: ['A'] })).toThrow()
    expect(() =>
      parsePollInput({ question: 'Q', options: ['1', '2', '3', '4', '5', '6', '7'] }),
    ).toThrow()
  })

  it('refuses a stored poll whose counts do not match its options', () => {
    expect(() => parsePoll({ ...poll([1, 2]), counts: [1] })).toThrow()
  })

  it('accepts only known roles and reactions in presence', () => {
    expect(parsePresence({ role: 'stage' })).toEqual({ role: 'stage' })
    expect(() => parsePresence({ role: 'audience', react: { e: 'rocket', n: 1 } })).toThrow()
    expect(() => parsePresence({})).toThrow()
  })
})
