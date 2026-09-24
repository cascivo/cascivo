/**
 * The per-PR visual job snapshots only what `scripts/visual/select.ts` picks. If it picked
 * nothing for a real component change, the PR would pass without its pixels ever being
 * compared — so the mapping is tested against the real registry.
 *
 * Run: node --experimental-strip-types --test scripts/checks/visual-select.test.ts
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { SAMPLE, selectComponents } from '../visual/select.ts'

const ROOT = join(import.meta.dirname, '..', '..')
const RAW = 'https://raw.githubusercontent.com/cascivo/cascivo/main/'
const registry = JSON.parse(readFileSync(join(ROOT, 'registry.json'), 'utf8')) as {
  components: { name: string; files?: string[] }[]
}

describe('visual-regression selection', () => {
  it('always includes the layout-sensitive sample, and every sample name exists', () => {
    const names = new Set(registry.components.map((c) => c.name))
    for (const s of SAMPLE) assert.ok(names.has(s), `sample entry "${s}" is not in the registry`)
    assert.deepEqual(selectComponents([], registry.components), [...SAMPLE].sort())
  })

  it('maps a changed component or layout file to its entry', () => {
    const picked = selectComponents(
      [
        'packages/components/src/accordion/accordion.module.css',
        'packages/layouts/src/sections/hero/hero.tsx',
      ],
      registry.components,
    )
    assert.ok(picked.includes('accordion'))
    assert.ok(picked.includes('section/hero'))
  })

  it('does not snapshot charts or flow parts, which never render stable pixels', () => {
    // Registry chart entries list no source files (they ship from npm), so use a synthetic one.
    const entries = [
      { name: 'chart/line-chart', files: [`${RAW}packages/charts/src/charts/line.tsx`] },
      { name: 'flow/flow-node', files: [`${RAW}packages/flow/src/node/node.tsx`] },
    ]
    const picked = selectComponents(
      ['packages/charts/src/charts/line.tsx', 'packages/flow/src/node/node.tsx'],
      entries,
    )
    assert.deepEqual(picked, [...SAMPLE].sort())
  })
})
