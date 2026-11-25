/**
 * The no-React packages stay `private: true` until a maintainer flips them (docs/plans/
 * htmx-solid-gap-analysis.md, F2), but they must already be measured by every release gate.
 * This keeps those gates from silently dropping one: a new element without a size budget,
 * or a package missing from the pack / isolated-install / bundle lists, fails here.
 */
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = (p: string) => fileURLToPath(new URL(`../../${p}`, import.meta.url))
const read = (p: string) => readFileSync(root(p), 'utf8')
const READY = ['@cascivo/elements', '@cascivo/solid']

describe('htmx + solid release readiness', () => {
  const elementsPkg = JSON.parse(read('packages/elements/package.json')) as {
    exports: Record<string, unknown>
  }
  const exported = Object.keys(elementsPkg.exports)
    .filter((k) => !k.endsWith('.json') && !k.endsWith('.css'))
    .map((k) => k.slice(2))

  it('every element export has a build entry and a size-budget case in elements:check', () => {
    const vite = read('packages/elements/vite.config.ts')
    const gate = read('scripts/checks/elements.test.ts')
    const list = /const ELEMENTS = \[([\s\S]*?)\] as const/.exec(gate)?.[1] ?? ''
    for (const name of exported) {
      assert.match(vite, new RegExp(`['"]?${name}['"]?: './src/${name}.ts'`), `${name}: no entry`)
      assert.ok(list.includes(`'${name}'`), `${name}: not in elements.test.ts ELEMENTS (no budget)`)
    }
  })

  it('every element and solid entry ships types', () => {
    for (const pkg of ['elements', 'solid']) {
      const { exports } = JSON.parse(read(`packages/${pkg}/package.json`)) as {
        exports: Record<string, unknown>
      }
      for (const [key, value] of Object.entries(exports)) {
        if (typeof value === 'string') continue
        assert.ok((value as { types?: string }).types, `@cascivo/${pkg} ${key}: no types condition`)
      }
    }
  })

  it('pack, bundle and isolated gates cover both packages', () => {
    const pack = read('scripts/checks/pack-lint.mjs')
    const bundle = read('scripts/quality/bundle-check.ts')
    const isolated = read('scripts/checks/isolated-install.test.ts')
    for (const name of READY) {
      assert.ok(pack.includes(`'${name}'`), `${name} missing from pack-lint PUBLISH_READY`)
      assert.ok(bundle.includes(`'${name}'`), `${name} missing from bundle-check`)
      const short = name.slice('@cascivo/'.length)
      assert.ok(
        new RegExp(`PACKAGES = \\[[^\\]]*'${short}'`).test(isolated),
        `${short} missing from isolated-install PACKAGES`,
      )
    }
  })
})
