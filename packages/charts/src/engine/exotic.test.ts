import { describe, expect, it } from 'vitest'
import { streamLayout, streamExtent } from './stream'
import { partition, maxDepth, sumValue } from './hierarchy'
import { sankeyLayout, linkPath } from './sankey'

describe('streamLayout', () => {
  const values = [
    [4, 6, 5],
    [2, 3, 7],
    [5, 2, 3],
  ]
  it('zero offset stacks from 0', () => {
    const b = streamLayout(values, 'zero')
    expect(b[0]![0]).toEqual([0, 4])
    expect(b[1]![0]).toEqual([4, 6])
  })
  it('silhouette centers each category (band sum spans the total around 0)', () => {
    const b = streamLayout(values, 'silhouette')
    // category 0 total = 11; bands should span [-5.5, 5.5]
    const [min, max] = streamExtent(b)
    expect(min).toBeLessThan(0)
    expect(max).toBeGreaterThan(0)
    expect(Math.abs(min + max)).toBeLessThan(1e-9) // symmetric for the fullest column
  })
})

describe('partition (sunburst layout)', () => {
  const tree = {
    label: 'root',
    children: [
      {
        label: 'a',
        children: [
          { label: 'a1', value: 3 },
          { label: 'a2', value: 1 },
        ],
      },
      { label: 'b', value: 4 },
    ],
  }
  it('sums values bottom-up', () => {
    expect(sumValue(tree)).toBe(8)
  })
  it('assigns angular slices proportional to value and tracks depth', () => {
    const nodes = partition(tree)
    expect(maxDepth(nodes)).toBe(2)
    const a = nodes.find((n) => n.node.label === 'a')!
    const b = nodes.find((n) => n.node.label === 'b')!
    // a (4) and b (4) split the circle evenly
    expect(a.a1 - a.a0).toBeCloseTo(b.a1 - b.a0, 6)
  })
})

describe('sankeyLayout', () => {
  const nodes = [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
    { id: 'c', label: 'C' },
  ]
  const links = [
    { source: 'a', target: 'b', value: 10 },
    { source: 'b', target: 'c', value: 6 },
  ]
  it('ranks nodes by longest path and positions them left→right', () => {
    const { nodes: laid } = sankeyLayout(nodes, links, { width: 300, height: 200 })
    const a = laid.find((n) => n.id === 'a')!
    const b = laid.find((n) => n.id === 'b')!
    const c = laid.find((n) => n.id === 'c')!
    expect(a.rank).toBe(0)
    expect(b.rank).toBe(1)
    expect(c.rank).toBe(2)
    expect(a.x0).toBeLessThan(b.x0)
    expect(b.x0).toBeLessThan(c.x0)
  })
  it('produces a closed ribbon path per link', () => {
    const { links: laidLinks } = sankeyLayout(nodes, links, { width: 300, height: 200 })
    expect(laidLinks.length).toBe(2)
    const d = linkPath(laidLinks[0]!)
    expect(d.startsWith('M')).toBe(true)
    expect(d.endsWith('Z')).toBe(true)
    expect(d).not.toContain('NaN')
  })
})
