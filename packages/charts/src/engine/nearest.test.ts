import { describe, expect, it } from 'vitest'
import { nearestIndex } from './nearest'

describe('nearestIndex', () => {
  it('returns -1 for empty array', () => expect(nearestIndex([], 5)).toBe(-1))
  it('returns 0 for single element', () => expect(nearestIndex([10], 99)).toBe(0))
  it('finds exact match', () => expect(nearestIndex([0, 10, 20, 30], 20)).toBe(2))
  it('finds nearest below', () => expect(nearestIndex([0, 10, 20, 30], 14)).toBe(1))
  it('finds nearest above', () => expect(nearestIndex([0, 10, 20, 30], 16)).toBe(2))
  it('handles endpoints', () => {
    expect(nearestIndex([0, 10, 20], -5)).toBe(0)
    expect(nearestIndex([0, 10, 20], 100)).toBe(2)
  })
})
