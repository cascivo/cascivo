import { describe, expect, it } from 'vitest'
import {
  defaultMatch,
  filterOptions,
  fold,
  groupOptions,
  highlightSegments,
  isNewLabel,
  orderByGroup,
  typeaheadIndex,
} from './option-list'
import type { ComboboxOption } from './option-list'

const options: ComboboxOption[] = [
  { value: 'zurich', label: 'Zürich', group: 'CH' },
  { value: 'geneva', label: 'Genève', group: 'CH' },
  { value: 'berlin', label: 'Berlin', group: 'DE' },
  { value: 'bonn', label: 'Bonn', disabled: true },
]

describe('fold', () => {
  it('strips diacritics and lowercases, one output char per input char', () => {
    expect(fold('Zürich').join('')).toBe('zurich')
    expect(fold('Genève')).toHaveLength('Genève'.length)
  })
})

describe('defaultMatch', () => {
  it('matches across diacritics in both directions', () => {
    expect(defaultMatch(options[0]!, 'zur')).toBe(true)
    expect(defaultMatch(options[0]!, 'Zür')).toBe(true)
  })

  it('matches the value as well as the label', () => {
    expect(defaultMatch({ value: 'de-be', label: 'Berlin' }, 'de-be')).toBe(true)
  })

  it('rejects a non-match and accepts an empty query', () => {
    expect(defaultMatch(options[2]!, 'zzz')).toBe(false)
    expect(defaultMatch(options[2]!, '')).toBe(true)
  })
})

describe('filterOptions', () => {
  it('returns every option for an empty query', () => {
    expect(filterOptions(options, '')).toHaveLength(4)
  })

  it('filters by folded substring', () => {
    expect(filterOptions(options, 'zurich').map((o) => o.value)).toEqual(['zurich'])
  })

  it('lets a server-driven caller opt out of local filtering', () => {
    expect(filterOptions(options, 'zzz', () => true)).toHaveLength(4)
  })

  it('honours a custom filter even for an empty query', () => {
    expect(filterOptions(options, '', (o) => o.group === 'CH').map((o) => o.value)).toEqual([
      'zurich',
      'geneva',
    ])
  })
})

describe('highlightSegments', () => {
  it('splits the label around the match', () => {
    expect(highlightSegments('Berlin', 'rli')).toEqual([
      { text: 'Be', match: false },
      { text: 'rli', match: true },
      { text: 'n', match: false },
    ])
  })

  it('marks the accented characters the user actually sees', () => {
    expect(highlightSegments('Zürich', 'zur')).toEqual([
      { text: 'Zür', match: true },
      { text: 'ich', match: false },
    ])
  })

  it('returns one unmatched segment when there is no query or no match', () => {
    expect(highlightSegments('Bonn', '')).toEqual([{ text: 'Bonn', match: false }])
    expect(highlightSegments('Bonn', 'zzz')).toEqual([{ text: 'Bonn', match: false }])
  })
})

describe('groupOptions / orderByGroup', () => {
  it('buckets by group, ungrouped first, keeping the filtered index', () => {
    const groups = groupOptions(options)
    expect(groups.map((g) => g.label)).toEqual([undefined, 'CH', 'DE'])
    expect(groups[1]!.entries.map((e) => e.index)).toEqual([0, 1])
  })

  it('returns the options in the order they will render', () => {
    expect(orderByGroup(options).map((o) => o.value)).toEqual([
      'bonn',
      'zurich',
      'geneva',
      'berlin',
    ])
  })

  it('leaves group indices contiguous, so keyboard order matches rendered order', () => {
    const indexes = groupOptions(orderByGroup(options)).flatMap((g) =>
      g.entries.map((e) => e.index),
    )
    expect(indexes).toEqual([0, 1, 2, 3])
  })

  it('is a no-op when nothing declares a group', () => {
    const flat: ComboboxOption[] = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]
    expect(orderByGroup(flat)).toEqual(flat)
  })
})

describe('isNewLabel', () => {
  it('is false when an option already carries the label, ignoring case and accents', () => {
    expect(isNewLabel(options, 'zurich')).toBe(false)
    expect(isNewLabel(options, 'BERLIN')).toBe(false)
  })

  it('is true for an unseen label and false for an empty query', () => {
    expect(isNewLabel(options, 'Vienna')).toBe(true)
    expect(isNewLabel(options, '')).toBe(false)
  })
})

describe('typeaheadIndex', () => {
  const flat: ComboboxOption[] = [
    { value: 'a', label: 'Apple' },
    { value: 'b', label: 'Banana' },
    { value: 'c', label: 'Blueberry', disabled: true },
    { value: 'd', label: 'Blackberry' },
  ]

  it('prefers a prefix match', () => {
    expect(typeaheadIndex(flat, 'ban', -1)).toBe(1)
  })

  it('searches forward from the current index and wraps', () => {
    expect(typeaheadIndex(flat, 'b', 1)).toBe(3)
    expect(typeaheadIndex(flat, 'a', 3)).toBe(0)
  })

  it('skips disabled options', () => {
    expect(typeaheadIndex(flat, 'blue', -1)).toBe(-1)
  })

  it('falls back to a substring match when no label starts with the query', () => {
    expect(typeaheadIndex(flat, 'nan', -1)).toBe(1)
  })

  it('returns -1 for an empty query or an empty list', () => {
    expect(typeaheadIndex(flat, '', 0)).toBe(-1)
    expect(typeaheadIndex([], 'a', 0)).toBe(-1)
  })
})
