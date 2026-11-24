import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { describe, it } from 'node:test'
import { breakingChanges, changesetCovers, requiredBump, type ContractJson } from './semver.ts'

const root = new URL('../../', import.meta.url)
const json = (p: string) => JSON.parse(readFileSync(new URL(p, root), 'utf8')) as ContractJson

const base: ContractJson = {
  format: 1,
  units: {
    button: {
      alias: 'cv-button',
      classes: { button: 'cv-button-button', label: 'cv-button-label' },
      anatomy: {
        root: { data: { 'data-variant': ['primary', 'ghost'] } },
        parts: { label: {} },
      },
    },
  },
}
const clone = () => structuredClone(base)

describe('breakingChanges', () => {
  it('adding is not breaking', () => {
    const n = clone()
    n.units['badge'] = {}
    n.units['button']!.classes!['icon'] = 'cv-button-icon'
    n.units['button']!.anatomy!.root.data!['data-variant']!.push('link')
    assert.deepEqual(breakingChanges(base, n), [])
  })
  it('flags removed units, classes, renames, parts, attrs and values', () => {
    const n = clone()
    delete n.units['button']!.classes!['label']
    n.units['button']!.classes!['button'] = 'cv-button-btn'
    delete n.units['button']!.anatomy!.parts!['label']
    n.units['button']!.anatomy!.root.data!['data-variant'] = ['primary']
    const got = breakingChanges(base, n).join('\n')
    for (const s of ['class removed: label', 'renamed', 'part removed: label', '"ghost" removed'])
      assert.match(got, new RegExp(s))
    assert.deepEqual(breakingChanges(base, { format: 1, units: {} }), ['unit removed: button'])
  })
})

describe('changesetCovers', () => {
  const cs = (b: string) => `---\n'@cascivo/css': ${b}\n---\n\nx`
  it('needs minor on 0.x and major after', () => {
    assert.equal(requiredBump('0.3.1'), 'minor')
    assert.equal(requiredBump('1.0.0'), 'major')
    assert.ok(changesetCovers([cs('minor')], 'minor'))
    assert.ok(!changesetCovers([cs('patch')], 'minor'))
    assert.ok(!changesetCovers([cs('minor')], 'major'))
    assert.ok(!changesetCovers([], 'minor'))
  })
})

describe('G1 contract semver gate', () => {
  it('a breaking diff against the published baseline carries a covering changeset', () => {
    const baseline = json('packages/css/contract.baseline.json')
    const breaks = breakingChanges(baseline, json('packages/css/contract.json'))
    if (!breaks.length) return
    const pkg = json('packages/css/package.json') as unknown as { version: string }
    const dir = new URL('.changeset/', root)
    const sets = readdirSync(dir)
      .filter((f) => f.endsWith('.md') && f !== 'README.md')
      .map((f) => readFileSync(new URL(f, dir), 'utf8'))
    assert.ok(
      changesetCovers(sets, requiredBump(pkg.version)),
      `breaking contract change needs a '@cascivo/css': ${requiredBump(pkg.version)} changeset:\n${breaks.join('\n')}`,
    )
  })
})
