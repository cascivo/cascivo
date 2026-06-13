import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { measureDist, MATRIX_COMPONENTS } from './bundle.ts'
import type { MatrixCell } from './types.ts'

describe('measureDist', () => {
  it('sums js and css gzip sizes separately, recursively', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bench-'))
    mkdirSync(join(dir, 'assets'))
    writeFileSync(join(dir, 'assets', 'a.js'), 'x'.repeat(10000))
    writeFileSync(join(dir, 'assets', 'b.css'), 'y'.repeat(5000))
    writeFileSync(join(dir, 'index.html'), '<html></html>')
    const m = measureDist(dir)
    expect(m.jsGzKb).toBeGreaterThan(0)
    expect(m.cssGzKb).toBeGreaterThan(0)
    expect(m.jsGzKb).toBeLessThan(1) // 10KB of one repeated char compresses tiny
    expect(m.jsRawKb).toBeCloseTo(10000 / 1024, 1)
  })
})

// Helpers to build synthetic matrix cells for unit-testing the metric formulas.
function makeCell(total: number, baseline: number, allIncrementals: number[]): MatrixCell {
  const incrementalGzKb = Math.round((total - baseline) * 100) / 100
  const standaloneGzKb = total
  const sumIncremental = allIncrementals.reduce((acc, v) => acc + v, 0)
  const amortizedGzKb = Math.round((sumIncremental / allIncrementals.length) * 100) / 100

  let note: string | undefined
  if (Math.abs(incrementalGzKb) < 0.05) {
    if (standaloneGzKb > 0) {
      note = `Standalone cost is ${standaloneGzKb} KB but marginal over runtime-preloaded baseline is ~0`
    } else {
      note = 'Shared runtime already in baseline; marginal cost is ~0'
    }
  }

  return {
    totalGzKb: total,
    incrementalGzKb,
    standaloneGzKb,
    amortizedGzKb,
    ...(note !== undefined ? { note } : {}),
  }
}

describe('MatrixCell metrics', () => {
  it('standaloneGzKb equals totalGzKb for a single component', () => {
    const cell = makeCell(50, 40, [10])
    expect(cell.standaloneGzKb).toBe(cell.totalGzKb)
    expect(cell.standaloneGzKb).toBe(50)
  })

  it('amortizedGzKb is sum of incrementals divided by count', () => {
    // 3 components with incrementals 10, 20, 30 → average = 20
    const incrementals = [10, 20, 30]
    const cells = [
      makeCell(50, 40, incrementals), // incremental = 10
      makeCell(60, 40, incrementals), // incremental = 20
      makeCell(70, 40, incrementals), // incremental = 30
    ]
    for (const cell of cells) {
      expect(cell.amortizedGzKb).toBe(20)
    }
  })

  it('near-zero incremental gets a note when standaloneGzKb > 0', () => {
    // total ≈ baseline so incremental rounds to 0.04 (< 0.05 threshold)
    const cell = makeCell(40.04, 40, [0.04])
    expect(Math.abs(cell.incrementalGzKb)).toBeLessThan(0.05)
    expect(cell.note).toContain('Standalone cost is')
    expect(cell.note).toContain('marginal over runtime-preloaded baseline is ~0')
  })

  it('near-zero incremental with zero standalone gets generic note', () => {
    const cell = makeCell(0, 0, [0])
    expect(cell.incrementalGzKb).toBe(0)
    expect(cell.note).toBe('Shared runtime already in baseline; marginal cost is ~0')
  })

  it('non-zero incremental has no note', () => {
    const cell = makeCell(55, 40, [15])
    expect(cell.incrementalGzKb).toBe(15)
    expect(cell.note).toBeUndefined()
  })
})

describe('MATRIX_COMPONENTS', () => {
  it('is a non-empty tuple of component names', () => {
    expect(MATRIX_COMPONENTS.length).toBeGreaterThan(0)
    for (const comp of MATRIX_COMPONENTS) {
      expect(typeof comp).toBe('string')
    }
  })
})
