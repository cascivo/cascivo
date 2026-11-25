/**
 * The no-React packages are published, so every release gate must measure them. This keeps a
 * gate from silently dropping one: a new element without a size budget, a package that is
 * private again, or one missing from the isolated-install / bundle lists, fails here.
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

  it('both packages are public and covered by the bundle and isolated gates', () => {
    const bundle = read('scripts/quality/bundle-check.ts')
    const isolated = read('scripts/checks/isolated-install.test.ts')
    for (const name of READY) {
      const short = name.slice('@cascivo/'.length)
      const pkg = JSON.parse(read(`packages/${short}/package.json`)) as { private?: boolean }
      assert.equal(pkg.private, false, `${name} must be public`)
      assert.ok(bundle.includes(`'${name}'`), `${name} missing from bundle-check`)
      assert.ok(
        new RegExp(`PACKAGES = \\[[^\\]]*'${short}'`).test(isolated),
        `${short} missing from isolated-install PACKAGES`,
      )
    }
  })
})
