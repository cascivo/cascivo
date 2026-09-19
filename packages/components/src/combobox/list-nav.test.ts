import { describe, expect, it } from 'vitest'
import {
  activeForValue,
  enabledIndexes,
  firstActive,
  lastActive,
  moveActive,
  pageActive,
} from './list-nav'
import type { ComboboxOption } from './option-list'

/** Index 1 is disabled, so every navigation result must skip it. */
const options: ComboboxOption[] = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B', disabled: true },
  { value: 'c', label: 'C' },
  { value: 'd', label: 'D' },
]

const allDisabled: ComboboxOption[] = [{ value: 'a', label: 'A', disabled: true }]

describe('enabledIndexes', () => {
  it('lists only the selectable positions', () => {
    expect(enabledIndexes(options)).toEqual([0, 2, 3])
    expect(enabledIndexes(allDisabled)).toEqual([])
  })
})

describe('moveActive', () => {
  it('skips disabled options in both directions', () => {
    expect(moveActive(0, 1, options)).toBe(2)
    expect(moveActive(2, -1, options)).toBe(0)
  })

  it('wraps at both ends', () => {
    expect(moveActive(3, 1, options)).toBe(0)
    expect(moveActive(0, -1, options)).toBe(3)
  })

  it('enters at the first option on ArrowDown and the last on ArrowUp when nothing is active', () => {
    expect(moveActive(-1, 1, options)).toBe(0)
    expect(moveActive(-1, -1, options)).toBe(3)
  })

  it('returns -1 when nothing is selectable', () => {
    expect(moveActive(-1, 1, allDisabled)).toBe(-1)
    expect(moveActive(0, 1, [])).toBe(-1)
  })
})

describe('firstActive / lastActive', () => {
  it('return the outermost enabled options', () => {
    expect(firstActive(options)).toBe(0)
    expect(lastActive(options)).toBe(3)
  })

  it('skip a disabled first option', () => {
    expect(firstActive([{ value: 'x', label: 'X', disabled: true }, ...options])).toBe(1)
  })

  it('return -1 when nothing is selectable', () => {
    expect(firstActive(allDisabled)).toBe(-1)
    expect(lastActive([])).toBe(-1)
  })
})

describe('pageActive', () => {
  const many: ComboboxOption[] = Array.from({ length: 30 }, (_, i) => ({
    value: String(i),
    label: `Option ${i}`,
  }))

  it('moves a page down and a page up', () => {
    expect(pageActive(0, 1, many)).toBe(10)
    expect(pageActive(20, -1, many)).toBe(10)
  })

  it('clamps rather than wrapping', () => {
    expect(pageActive(25, 1, many)).toBe(29)
    expect(pageActive(3, -1, many)).toBe(0)
  })

  it('counts enabled rows only', () => {
    expect(pageActive(0, 1, options)).toBe(3)
  })
})

describe('activeForValue', () => {
  it('opens onto the selected option', () => {
    expect(activeForValue(options, 'c')).toBe(2)
  })

  it('falls back to the first enabled option when the value is absent', () => {
    expect(activeForValue(options, 'zzz')).toBe(0)
    expect(activeForValue(options, undefined)).toBe(0)
  })

  it('never opens onto a disabled option, even a selected one', () => {
    expect(activeForValue(options, 'b')).toBe(0)
  })

  it('skips a disabled first option when there is no value', () => {
    const leadingDisabled: ComboboxOption[] = [
      { value: 'x', label: 'X', disabled: true },
      { value: 'y', label: 'Y' },
    ]
    // The old build seeded activeIndex to a bare 0, so Enter silently did nothing here.
    expect(activeForValue(leadingDisabled, undefined)).toBe(1)
  })

  it('returns -1 when nothing is selectable', () => {
    expect(activeForValue(allDisabled, 'a')).toBe(-1)
  })
})
