// Reference output for crates/cascivo-html brand math: `configToCSS` fed with the oklch of a hex.
// The Rust test (tests/brand.rs) checks its accent lines against these fixtures.
// Regenerate with UPDATE_FIXTURES=1.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { configToCSS } from '../../../packages/theme-kit/src/css.ts'

const DIR = resolve(import.meta.dirname, '../../../crates/cascivo-html/tests/brand')

function hexToOklch(hex: string): { h: number; c: number } {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const c = Math.hypot(a, bb)
  const h = c < 0.0004 ? 0 : ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360
  return { h: Number(h.toFixed(3)), c: Number(c.toFixed(3)) }
}

const FIXTURES = [
  { name: 'indigo-light', hex: '#5b5bd6', mode: 'light' as const },
  { name: 'rose-dark', hex: '#e11d48', mode: 'dark' as const },
  { name: 'green-light', hex: '#16a34a', mode: 'light' as const },
]

describe('brand fixtures', () => {
  for (const f of FIXTURES) {
    it(f.name, () => {
      const { h, c } = hexToOklch(f.hex)
      const css = configToCSS({
        baseMode: f.mode,
        accentHue: h,
        accentChroma: c,
        radiusBase: 0.375,
        fontFamily: 'system',
        presetId: null,
      })
      const file = resolve(DIR, `${f.name}.snap`)
      if (process.env.UPDATE_FIXTURES || !existsSync(file)) {
        mkdirSync(DIR, { recursive: true })
        writeFileSync(file, css + '\n')
      }
      expect(readFileSync(file, 'utf8')).toBe(css + '\n')
    })
  }
})
