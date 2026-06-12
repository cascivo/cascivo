import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { measureDist } from './bundle.ts'

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
