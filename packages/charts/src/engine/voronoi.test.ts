import { describe, expect, it } from 'vitest'
import { voronoiFind, voronoiCells, cellPath, type Vec } from './voronoi'

const sites: Vec[] = [
  [10, 10],
  [90, 10],
  [10, 90],
  [90, 90],
  [50, 50],
]
const bounds = { x0: 0, y0: 0, x1: 100, y1: 100 }

function bruteNearest(x: number, y: number): number {
  let best = -1
  let bd = Infinity
  sites.forEach((s, i) => {
    const d = (s[0] - x) ** 2 + (s[1] - y) ** 2
    if (d < bd) {
      bd = d
      best = i
    }
  })
  return best
}

describe('voronoiFind', () => {
  it('matches a brute-force nearest scan over a grid', () => {
    for (let x = 0; x <= 100; x += 7) {
      for (let y = 0; y <= 100; y += 7) {
        expect(voronoiFind(sites, x, y)).toBe(bruteNearest(x, y))
      }
    }
  })
  it('returns -1 for an empty set', () => {
    expect(voronoiFind([], 5, 5)).toBe(-1)
  })
})

describe('voronoiCells', () => {
  const cells = voronoiCells(sites, bounds)

  it('produces one polygon per site', () => {
    expect(cells.length).toBe(sites.length)
    for (const c of cells) expect(c.length).toBeGreaterThanOrEqual(3)
  })

  it('a site lies inside its own cell (point-in-polygon)', () => {
    const inside = (poly: Vec[], p: Vec) => {
      let win = false
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[i]!
        const b = poly[j]!
        if (
          a[1] > p[1] !== b[1] > p[1] &&
          p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
        ) {
          win = !win
        }
      }
      return win
    }
    sites.forEach((s, i) => expect(inside(cells[i]!, s)).toBe(true))
  })

  it('cells stay within the bounds', () => {
    for (const c of cells) {
      for (const [x, y] of c) {
        expect(x).toBeGreaterThanOrEqual(-1e-6)
        expect(x).toBeLessThanOrEqual(100 + 1e-6)
        expect(y).toBeGreaterThanOrEqual(-1e-6)
        expect(y).toBeLessThanOrEqual(100 + 1e-6)
      }
    }
  })

  it('cellPath emits a closed path', () => {
    const d = cellPath(cells[0]!)
    expect(d.startsWith('M')).toBe(true)
    expect(d.endsWith('Z')).toBe(true)
  })
})
