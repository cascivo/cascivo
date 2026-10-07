import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { componentDirectory, generateTsx, parseViewConfig } from './generate.js'

const ROOT = join(import.meta.dirname, '../../../..')

const EMPTY_METAS = new Map()

describe('cascade generate', () => {
  it('emits data/action props from $data / $actions refs', () => {
    const tsx = generateTsx(
      {
        view: {
          regions: {
            main: [
              { component: 'Badge', props: { variant: 'secondary' }, children: 'Hello' },
              { component: 'Button', events: { onClick: '$actions.openUser' } },
            ],
          },
        },
      },
      EMPTY_METAS,
      { dir: './ui' },
    )
    expect(tsx).toContain('onClick={actions.openUser}')
    expect(tsx).toContain('openUser: (...args: unknown[]) => unknown')
  })

  it('emits useSignal declarations and wiring for $state', () => {
    const tsx = generateTsx(
      {
        state: { query: '', open: false },
        view: {
          regions: {
            main: [
              {
                component: 'Input',
                bind: { value: '$state.query' },
                events: { onChange: '$state.set.query' },
              },
              {
                component: 'Button',
                bind: { disabled: '$state.open' },
                events: { onClick: '$state.toggle.open' },
              },
            ],
          },
        },
      },
      EMPTY_METAS,
      { dir: './ui' },
    )
    expect(tsx).toContain("import { useSignal, useSignals } from '@cascivo/core'")
    expect(tsx).toContain('useSignals()')
    expect(tsx).toContain("const query = useSignal('')")
    expect(tsx).toContain('const open = useSignal(false)')
    expect(tsx).toContain('value={query.value}')
    expect(tsx).toContain('onChange={(e) => (query.value = coerceValue(e))}')
    expect(tsx).toContain('onClick={() => (open.value = !open.value)}')
    expect(tsx).toContain('function coerceValue')
    // State refs must NOT leak into the data/actions PageProps.
    expect(tsx).not.toContain('data.query')
    expect(tsx).not.toContain('actions.query')
  })

  it('omits the coerceValue helper when no $state.set is used', () => {
    const tsx = generateTsx(
      {
        state: { open: false },
        view: {
          regions: { main: [{ component: 'Button', events: { onClick: '$state.toggle.open' } }] },
        },
      },
      EMPTY_METAS,
      { dir: './ui' },
    )
    expect(tsx).not.toContain('function coerceValue')
    expect(tsx).toContain('const open = useSignal(false)')
  })

  it('imports each component from its kebab-case registry directory', () => {
    const tsx = generateTsx(
      {
        view: {
          regions: {
            main: [
              { component: 'DataTable' },
              { component: 'Grid', children: [{ component: 'GridItem' }] },
            ],
          },
        },
      },
      EMPTY_METAS,
      { dir: './ui' },
    )
    expect(tsx).toContain("import { DataTable } from './ui/data-table'")
    // A sub-component shares its owner's import line.
    expect(tsx).toContain("import { Grid, GridItem } from './ui/grid'")
    expect(tsx).not.toContain('datatable')
  })

  it('imports everything from one package with a package source', () => {
    const tsx = generateTsx(
      { view: { regions: { main: [{ component: 'Stat' }, { component: 'Card' }] } } },
      EMPTY_METAS,
      { package: '@cascivo/react' },
    )
    expect(tsx).toContain("import { Card, Stat } from '@cascivo/react'")
  })

  it('emits text and attribute values that cannot break out of their JSX position', () => {
    const tsx = generateTsx(
      {
        view: {
          regions: {
            main: [{ component: 'Badge', props: { title: 'say "hi"' }, children: '{alert(1)}' }],
          },
        },
      },
      EMPTY_METAS,
      { dir: './ui' },
    )
    expect(tsx).toContain('title={"say \\"hi\\""}')
    expect(tsx).toContain('{"{alert(1)}"}')
  })
})

describe('parseViewConfig', () => {
  const view = (node: unknown) => ({ view: { regions: { main: [node] } } })

  it('accepts a well-formed config', () => {
    const config = parseViewConfig({
      $schema: 'x',
      state: { open: false },
      view: {
        regions: { main: [{ component: 'Button', events: { onClick: '$state.toggle.open' } }] },
      },
    })
    expect(config.view.regions.main?.[0]?.component).toBe('Button')
  })

  it.each([
    ['a component name that is not an identifier', view({ component: "X'; import 'y" })],
    ['a prop name that is not an identifier', view({ component: 'Button', props: { 'a b': 1 } })],
    ['a ref outside $data/$actions/$state', view({ component: 'Button', bind: { x: 'window.y' } })],
    ['a state key that is not an identifier', { state: { 'a-b': 1 }, view: { regions: {} } }],
    ['a missing view', {}],
  ])('rejects %s', (_label, raw) => {
    expect(() => parseViewConfig(raw)).toThrow(/Invalid ViewConfig at/)
  })
})

describe('componentDirectory', () => {
  // `cascivo add` installs every component and layout into `<outputDir>/<registry dir>`, so
  // generated imports are only right if every exported name resolves to its item's directory.
  const registry: unknown = JSON.parse(readFileSync(join(ROOT, 'registry.json'), 'utf8'))
  const items = (
    registry as { components: { name: string; type?: string; meta?: { name: string } }[] }
  ).components

  it('resolves every installable registry component to its own directory', () => {
    const wrong = items
      .filter((c) => (c.type === 'component' || c.type === 'layout') && c.meta)
      .filter((c) => componentDirectory(c.meta!.name) !== c.name.split('/').pop())
      .map((c) => `${c.meta!.name} → ${componentDirectory(c.meta!.name)} (installed as ${c.name})`)
    expect(wrong).toEqual([])
  })

  it('resolves every name <CascivoView> renders to a directory that exists', () => {
    const source = readFileSync(join(ROOT, 'packages/render/src/component-names.ts'), 'utf8')
    const names = [...source.matchAll(/^\s+'(\w+)',$/gm)].map((m) => m[1]!)
    expect(names.length).toBeGreaterThan(40)
    const directories = new Set(items.map((c) => c.name.split('/').pop()))
    const missing = names.filter((n) => !directories.has(componentDirectory(n)))
    expect(missing).toEqual([])
  })
})
