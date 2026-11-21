import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { chartCount, componentCount, themeCount, webData } from './web-data'
import { SHOWCASE } from './pages/showcase/data'

const root = resolve(__dirname, '../../../..')
const data = webData(root)
const registry = JSON.parse(readFileSync(resolve(root, 'registry.json'), 'utf8')) as {
  components: { type?: string }[]
}
const bench = JSON.parse(
  readFileSync(resolve(root, 'apps/bench/results/results.json'), 'utf8'),
) as {
  bundle: { apps: Record<string, { totalGzKb: number }> }
  runtime: Record<string, Record<string, { median: number }>>
  a11y: { cascade: { violations: number } }
}

describe('webData', () => {
  it('counts match registry.json and the theme sheets', () => {
    expect(data.counts.components).toBe(registry.components.length)
    expect(data.counts.charts).toBe(registry.components.filter((c) => c.type === 'chart').length)
    expect(data.counts).toEqual({
      components: componentCount(root),
      themes: themeCount(root),
      charts: chartCount(root),
    })
    expect(data.counts.themes).toBeGreaterThan(0)
  })

  it('figures follow the figures.ts formulas', () => {
    const update = bench.runtime['update-every-10th']
    const cascade = update?.cascade?.median ?? 0
    const shadcn = update?.shadcn?.median ?? 0
    expect(data.figures.gzip?.cascivo).toBe(bench.bundle.apps.cascade?.totalGzKb)
    expect(data.figures.partial).toEqual({
      cascivoMs: Math.round(cascade),
      shadcnMs: Math.round(shadcn),
      speedup: shadcn / cascade,
    })
    expect(data.figures.axeViolations).toBe(bench.a11y.cascade.violations)
    expect(data.formatted.speedup).toBe(`${(shadcn / cascade).toFixed(1)}×`)
    expect(data.heroStats.map((s) => s.tone)).toEqual(['acid', 'surface', 'invert'])
    expect(data.heroStats[0]?.value).toMatch(/^\d+\.\d KB$/)
  })

  it('serialises to plain JSON (no undefined holes)', () => {
    expect(JSON.parse(JSON.stringify(data))).toEqual(data)
  })

  it('carries the nav, showcase and builder lists', () => {
    expect(data.nav.primary.map((l) => l.label)).toEqual(['Docs', 'Examples', 'Guides'])
    expect(data.nav.footer.length).toBeGreaterThan(0)
    expect(data.showcase).toHaveLength(4)
    expect(data.showcaseTotal).toBe(SHOWCASE.length)
    expect(data.showcase[0]?.host).not.toMatch(/^https?:/)
    expect(data.themes).toHaveLength(12)
    expect(Array.isArray(data.starters)).toBe(true)
  })
})
