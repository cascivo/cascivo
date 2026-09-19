import { describe, expect, it } from 'vitest'
import {
  clampActive,
  enabledIndexes,
  firstActive,
  lastActive,
  moveActive,
  pageActive,
} from './list-nav'
import type { MultiSelectOption } from './option-list'

/** Index 1 is disabled, so every navigation result must skip it. */
const options: MultiSelectOption[] = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B', disabled: true },
  { value: 'c', label: 'C' },
  { value: 'd', label: 'D' },
]

const allDisabled: MultiSelectOption[] = [{ value: 'a', label: 'A', disabled: true }]

describe('enabledIndexes', () => {
  it('lists only the selectable positions', () => {
    expect(enabledIndexes(options)).toEqual([0, 2, 3])
    expect(enabledIndexes(allDisabled)).toEqual([])
  })
})

describe('moveActive', () => {
  it('skips disabled options going forward', () => {
    expect(moveActive(0, 1, options)).toBe(2)
  })

  it('skips disabled options going backward', () => {
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
  const many: MultiSelectOption[] = Array.from({ length: 30 }, (_, i) => ({
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

  it('enters from the correct end when nothing is active', () => {
    expect(pageActive(-1, 1, many)).toBe(9)
    expect(pageActive(-1, -1, many)).toBe(20)
  })

  it('counts enabled rows only', () => {
    expect(pageActive(0, 1, options)).toBe(3)
  })
})

describe('clampActive', () => {
  it('keeps a still-valid index', () => {
    expect(clampActive(2, options)).toBe(2)
  })

  it('falls back to the first enabled option when the index went out of range', () => {
    expect(clampActive(9, options)).toBe(0)
  })

  it('falls back when the index now points at a disabled option', () => {
    expect(clampActive(1, options)).toBe(0)
  })

  it('returns -1 when the filtered list is empty', () => {
    expect(clampActive(0, [])).toBe(-1)
  })
})
