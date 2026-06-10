import { describe, expect, it } from 'vitest'
import { areaPath, arcPath, linePath, stackSeries } from './shape'

describe('linePath', () => {
  it('returns empty string for empty input', () => {
    expect(linePath([])).toBe('')
  })

  it('emits M for single point', () => {
    expect(linePath([[10, 20]])).toBe('M10,20')
  })

  it('emits M/L for linear', () => {
    const d = linePath([
      [0, 0],
      [10, 5],
      [20, 10],
    ])
    expect(d).toMatch(/^M0,0L10,5L20,10$/)
  })

  it('emits C segments for monotone', () => {
    const d = linePath(
      [
        [0, 0],
        [10, 5],
        [20, 10],
      ],
      'monotone',
    )
    expect(d).toMatch(/^M/)
    expect(d).toContain('C')
  })
})

describe('areaPath', () => {
  it('closes to baseline', () => {
    const d = areaPath(
      [
        [0, 10],
        [10, 20],
      ],
      0,
    )
    expect(d).toContain('L10,0')
    expect(d).toContain('L0,0')
    expect(d).toContain('Z')
  })
})

describe('arcPath', () => {
  it('produces a valid path string', () => {
    const d = arcPath(100, 100, 80, 40, 0, Math.PI)
    expect(d).toMatch(/^M/)
    expect(d).toContain('A')
  })

  it('handles full circle (splits into two arcs)', () => {
    const d = arcPath(100, 100, 80, 40, 0, 2 * Math.PI)
    const arcCount = (d.match(/A/g) ?? []).length
    expect(arcCount).toBe(4) // two half-circles, each with outer+inner arc
  })
})

describe('stackSeries', () => {
  it('offsets are cumulative', () => {
    const result = stackSeries([
      [1, 2, 3],
      [4, 5, 6],
    ])
    expect(result[0]).toEqual([
      [0, 1],
      [0, 2],
      [0, 3],
    ])
    expect(result[1]).toEqual([
      [1, 5],
      [2, 7],
      [3, 9],
    ])
  })

  it('handles empty series', () => {
    expect(stackSeries([])).toEqual([])
  })
})
