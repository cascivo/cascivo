import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { P50_COLOR, P95_COLOR, P99_COLOR } from '../src/sections/ChartPanel'

const SRC = join(import.meta.dirname, '../src')

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? sources(join(dir, e.name))
      : /\.(tsx?|css)$/.test(e.name)
        ? [join(dir, e.name)]
        : [],
  )
}

// The landing page embeds Pulse in its own theme; a literal colour or a categorical chart hue
// painted a rainbow over the poster palette. Every colour must come from theme tokens.
describe('pulse palette', () => {
  it('uses no literal colours', () => {
    const literal = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/i
    for (const file of sources(SRC)) {
      const hits = readFileSync(file, 'utf8')
        .split('\n')
        .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
        .filter((line) => literal.test(line))
      expect(hits, file).toEqual([])
    }
  })

  it('reads the chart palette only through palette.css', () => {
    for (const file of sources(SRC)) {
      if (file.endsWith('palette.css')) continue
      const text = readFileSync(file, 'utf8')
      // Re-pointing a chart token locally (the heatmap) is fine; reading a raw chart hue is not.
      expect(text.match(/var\(--cascivo-chart-\d\)/g) ?? [], file).toEqual([])
    }
  })

  it('draws the latency percentiles from the ink ramp', () => {
    expect([P50_COLOR, P95_COLOR, P99_COLOR]).toEqual([
      'var(--pulse-ink-3)',
      'var(--pulse-ink-2)',
      'var(--pulse-ink)',
    ])
  })
})
