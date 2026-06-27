import { describe, expect, it } from 'vitest'
import { angleBand, polarPoint, radiusScale } from './polar'

describe('polarPoint', () => {
  it('places angle 0 straight up from the centre', () => {
    const [x, y] = polarPoint(100, 100, 50, 0)
    expect(x).toBeCloseTo(100, 6)
    expect(y).toBeCloseTo(50, 6)
  })
  it('places a quarter turn to the right', () => {
    const [x, y] = polarPoint(100, 100, 50, Math.PI / 2)
    expect(x).toBeCloseTo(150, 6)
    expect(y).toBeCloseTo(100, 6)
  })
})

describe('angleBand', () => {
  it('divides the circle into equal slices with centres at slice midpoints', () => {
    const band = angleBand(['a', 'b', 'c', 'd'])
    expect(band.bandwidth).toBeCloseTo(Math.PI / 2, 6)
    expect(band.map('a')).toBeCloseTo(0, 6)
    expect(band.center('a')).toBeCloseTo(Math.PI / 4, 6)
    expect(band.map('c')).toBeCloseTo(Math.PI, 6)
    expect(band.map('z')).toBeUndefined()
  })
})

describe('radiusScale', () => {
  it('maps the value domain to the radius range', () => {
    const r = radiusScale([0, 10], [20, 120])
    expect(r.map(0)).toBeCloseTo(20, 6)
    expect(r.map(10)).toBeCloseTo(120, 6)
    expect(r.map(5)).toBeCloseTo(70, 6)
  })
})
