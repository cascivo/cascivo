/**
 * Unit tests for the standalone-install integrity helpers (`deps-graph.ts`).
 * Run with: `node --experimental-strip-types --test scripts/registry/deps-check.test.ts`.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  findViolations,
  parseRelativeImports,
  resolveImportPath,
  transitiveRegistryDeps,
  BASE_URL,
  type RegistryShape,
} from './deps-graph.ts'

test('parseRelativeImports collects relative specifiers only', () => {
  const src = `
    import { a } from '../popover/use-popover'
    import b from './local'
    import { c } from '@cascivo/core'
    import 'react'
    export { d } from '../tooltip/tooltip'
    const x = await import('./lazy')
  `
  const specs = parseRelativeImports(src).sort()
  assert.deepEqual(specs, ['../popover/use-popover', '../tooltip/tooltip', './lazy', './local'])
})

test('parseRelativeImports handles multi-line and type imports', () => {
  const src = `import type {\n  A,\n  B,\n} from '../x/y'`
  assert.deepEqual(parseRelativeImports(src), ['../x/y'])
})

test('resolveImportPath tries candidate extensions', () => {
  const present = new Set(['/p/a/use-popover.ts', '/p/a/styles.module.css', '/p/b/index.tsx'])
  const exists = (p: string) => present.has(p)
  assert.equal(resolveImportPath('/p/c/c.tsx', '../a/use-popover', exists), '/p/a/use-popover.ts')
  assert.equal(
    resolveImportPath('/p/c/c.tsx', '../a/styles.module.css', exists),
    '/p/a/styles.module.css',
  )
  assert.equal(resolveImportPath('/p/c/c.tsx', '../b', exists), '/p/b/index.tsx')
  assert.equal(resolveImportPath('/p/c/c.tsx', '../missing', exists), null)
})

const url = (rel: string) => `${BASE_URL}/${rel}`

function registry(): RegistryShape {
  return {
    components: [
      {
        name: 'shell-header',
        files: [url('pkg/shell-header/shell-header.tsx')],
        registryDependencies: ['popover'],
      },
      {
        name: 'popover',
        files: [url('pkg/popover/popover.tsx'), url('pkg/popover/use-popover.ts')],
      },
      { name: 'lonely', files: [url('pkg/lonely/lonely.tsx')] },
    ],
  }
}

test('transitiveRegistryDeps walks the graph (and is cycle-safe)', () => {
  const reg: RegistryShape = {
    components: [
      { name: 'a', files: [], registryDependencies: ['b'] },
      { name: 'b', files: [], registryDependencies: ['a'] },
    ],
  }
  assert.deepEqual([...transitiveRegistryDeps(reg, 'a')].sort(), ['a', 'b'])
})

test('findViolations: undeclared cross-component import is flagged', () => {
  const reg = registry()
  const read = (p: string) =>
    p.endsWith('lonely.tsx') ? `import { usePopover } from '../popover/use-popover'` : ''
  const exists = (p: string) => p.endsWith('/popover/use-popover.ts') || p.endsWith('.tsx')
  const v = findViolations(reg, '/repo', read, exists)
  assert.equal(v.length, 1)
  assert.equal(v[0]?.component, 'lonely')
  assert.equal(v[0]?.kind, 'undeclared')
  assert.equal(v[0]?.owner, 'popover')
})

test('findViolations: declared dependency passes', () => {
  const reg = registry()
  const read = (p: string) =>
    p.endsWith('shell-header.tsx') ? `import { usePopover } from '../popover/use-popover'` : ''
  const exists = (p: string) => p.endsWith('/popover/use-popover.ts') || p.endsWith('.tsx')
  assert.deepEqual(findViolations(reg, '/repo', read, exists), [])
})
