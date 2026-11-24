import { gzipSync } from 'node:zlib'
import { join } from 'node:path'
import { build } from 'vite-plus'
import { describe, expect, it } from 'vitest'
import { cascivoSolid } from './vite.ts'

/** Phase 3 checkpoint δ: each island ≤ 10 KB gz with the Solid runtime included. */
const BUDGET = 10 * 1024

describe('cascivoSolid preset', () => {
  it('builds a sample island with fixed names, a default export and stays within budget', async () => {
    const root = join(process.cwd(), 'sample')
    const res = await build({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [cascivoSolid({ islands: { counter: 'counter.tsx' } })],
      resolve: {
        alias: [{ find: /^@cascivo\/solid$/, replacement: join(process.cwd(), 'src/index.ts') }],
      },
      build: { write: false },
    })
    const out = (Array.isArray(res) ? res[0]! : res) as {
      output: { fileName: string; type: string; code?: string }[]
    }
    const js = out.output.find((o) => o.fileName === 'counter.js')
    expect(js?.code).toMatch(/export\s*\{[^}]*as default/)
    const bytes = gzipSync(js?.code ?? '', { level: 9 }).length
    console.info(`island counter.js: ${bytes} B gz (budget ${BUDGET})`)
    expect(bytes).toBeLessThanOrEqual(BUDGET)
    // The class map must have been inlined away, not shipped whole.
    expect(js?.code).not.toContain('cv-accordion')
    expect(js?.code).toContain('cv-card-card')
  })
})
