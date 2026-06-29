/**
 * Unit tests for prefix stripping and name resolution behaviour in the add
 * command. Network I/O is not exercised here — those paths are covered by e2e
 * tests.
 */
import { describe, expect, it } from 'vitest'
import { resolveBareClosure, resolveTemplateTarget } from './add.js'
import type { Registry, RegistryComponent } from '../utils/registry.js'

/**
 * Mirrors the outputName computation in add.ts so we can assert it without
 * wiring up HTTP mocks.
 */
function outputName(registryName: string): string {
  return registryName.includes('/') ? registryName.split('/').pop()! : registryName
}

describe('outputName (prefix stripping)', () => {
  it('returns the bare name for an unprefixed component', () => {
    expect(outputName('button')).toBe('button')
  })

  it('strips a layout/ prefix', () => {
    expect(outputName('layout/app-shell')).toBe('app-shell')
  })

  it('strips a block/ prefix', () => {
    expect(outputName('block/users-table-page')).toBe('users-table-page')
  })

  it('strips only the last segment for deeply nested names', () => {
    expect(outputName('a/b/c')).toBe('c')
  })
})

function comp(name: string, registryDependencies?: string[]): RegistryComponent {
  return {
    name,
    description: '',
    category: '',
    version: '0.0.0',
    files: [`https://example/${name}.tsx`],
    dependencies: [],
    tags: [],
    meta: { name },
    ...(registryDependencies ? { registryDependencies } : {}),
  }
}

function makeRegistry(...components: RegistryComponent[]): Registry {
  return { version: '0.0.0', generatedAt: '', components, blocks: [] }
}

describe('resolveBareClosure (transitive registry dependencies)', () => {
  it('pulls a component and its declared registry dependency', () => {
    const registry = makeRegistry(comp('shell-header', ['popover']), comp('popover'))
    const { resolved, missing } = resolveBareClosure(registry, ['shell-header'])
    expect(missing).toEqual([])
    expect(resolved.map((r) => r.entry.name)).toEqual(['shell-header', 'popover'])
    expect(resolved.find((r) => r.entry.name === 'shell-header')?.requested).toBe(true)
    expect(resolved.find((r) => r.entry.name === 'popover')?.requested).toBe(false)
  })

  it('resolves multiple registry dependencies (side-nav → popover + tooltip)', () => {
    const registry = makeRegistry(
      comp('side-nav', ['popover', 'tooltip']),
      comp('popover'),
      comp('tooltip'),
    )
    const { resolved } = resolveBareClosure(registry, ['side-nav'])
    expect(resolved.map((r) => r.entry.name).sort()).toEqual(['popover', 'side-nav', 'tooltip'])
  })

  it('installs a shared dependency exactly once across two requested components', () => {
    const registry = makeRegistry(
      comp('shell-header', ['popover']),
      comp('menu', ['popover']),
      comp('popover'),
    )
    const { resolved } = resolveBareClosure(registry, ['shell-header', 'menu'])
    const popovers = resolved.filter((r) => r.entry.name === 'popover')
    expect(popovers).toHaveLength(1)
  })

  it('terminates on a dependency cycle, installing each once', () => {
    const registry = makeRegistry(comp('a', ['b']), comp('b', ['a']))
    const { resolved } = resolveBareClosure(registry, ['a'])
    expect(resolved.map((r) => r.entry.name).sort()).toEqual(['a', 'b'])
  })

  it('reports an unknown name as missing without throwing', () => {
    const registry = makeRegistry(comp('button'))
    const { resolved, missing } = resolveBareClosure(registry, ['nope'])
    expect(resolved).toEqual([])
    expect(missing).toEqual(['nope'])
  })

  it('resolves a bare name to its namespaced entry via suffix match', () => {
    const registry = makeRegistry(comp('layout/stack'))
    const { resolved } = resolveBareClosure(registry, ['stack'])
    expect(resolved.map((r) => r.entry.name)).toEqual(['layout/stack'])
  })

  it('resolves naming aliases to the layout primitive (flex/box → layout/stack)', () => {
    const registry = makeRegistry(comp('layout/stack'), comp('layout/spacer'))
    expect(resolveBareClosure(registry, ['flex']).resolved[0]?.entry.name).toBe('layout/stack')
    expect(resolveBareClosure(registry, ['box']).resolved[0]?.entry.name).toBe('layout/stack')
    expect(resolveBareClosure(registry, ['gap']).resolved[0]?.entry.name).toBe('layout/spacer')
  })
})

describe('resolveTemplateTarget', () => {
  it('resolves a template file target relative to the project root', () => {
    expect(resolveTemplateTarget('/proj', 'src/pages/dashboard.tsx')).toBe(
      '/proj/src/pages/dashboard.tsx',
    )
  })

  it('normalizes nested relative segments', () => {
    expect(resolveTemplateTarget('/proj', './src/../src/app.tsx')).toBe('/proj/src/app.tsx')
  })
})
